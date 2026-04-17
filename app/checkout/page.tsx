'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/CartContext'

export default function CheckoutPage() {
    const router = useRouter()
    const { cartItems, clearCart } = useCart()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [colonias, setColonias] = useState<string[]>([])
    const [loadingColonias, setLoadingColonias] = useState(false)

    const [form, setForm] = useState({
        email: '',
        phone: '',
        name: '',
        street: '',
        external_number: '',
        internal_number: '',
        postal_code: '',
        neighborhood: '',
        references_comments: '',
        payment_method: 'efectivo'
    })

    const subtotal = cartItems.reduce((acc, item) => acc + item.sale_price, 0)
    const shipping_cost = subtotal >= 499 ? 0 : 60
    const total_with_shipping = subtotal + shipping_cost

    useEffect(() => {
        if (cartItems.length === 0 && !loading && !isSuccess) {
            router.push('/catalogo')
        }
    }, [cartItems, loading, router, isSuccess])

    useEffect(() => {
        const initCheckout = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setUserId(session.user.id)

                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, name, phone')
                    .eq('id', session.user.id)
                    .single()

                // Fetch last address
                const { data: addresses } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)

                const address = addresses && addresses.length > 0 ? addresses[0] : null

                setForm(prev => ({
                    ...prev,
                    email: profile?.email || session.user.email || '',
                    phone: profile?.phone || '',
                    name: profile?.name || '',
                    street: address?.street || '',
                    external_number: address?.external_number || '',
                    internal_number: address?.internal_number || '',
                    postal_code: address?.postal_code || '',
                    neighborhood: address?.neighborhood || '',
                    references_comments: address?.references_comments || ''
                }))
            }
            setLoading(false)
        }
        initCheckout()
    }, [])

    // Fetch colonias when CP changes
    useEffect(() => {
        const fetchColonias = async () => {
            const cp = form.postal_code.trim()
            if (cp.length === 5) {
                setLoadingColonias(true)
                try {
                    const res = await fetch(`https://api.zippopotam.us/mx/${cp}`)
                    if (res.ok) {
                        const data = await res.json()
                        const places: string[] = data.places.map((p: any) => p['place name'])
                        setColonias(places)
                        // If current neighborhood is not in the list, auto-select the first one
                        if (places.length > 0 && !places.includes(form.neighborhood)) {
                            setForm(prev => ({ ...prev, neighborhood: places[0] }))
                        }
                    } else {
                        setColonias([])
                    }
                } catch (err) {
                    console.error("Error fetching postal code", err)
                    setColonias([])
                } finally {
                    setLoadingColonias(false)
                }
            } else if (cp.length < 5) {
                setColonias([])
            }
        }

        // Timeout to debounce slightly
        const timeoutId = setTimeout(fetchColonias, 300)
        return () => clearTimeout(timeoutId)
    }, [form.postal_code]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (cartItems.length === 0) return
        setSubmitting(true)

        try {
            // 1. Manage Address
            let addressId: string | null = null

            // If user is logged in, we update profile
            if (userId) {
                await supabase.from('profiles').update({
                    name: form.name,
                    phone: form.phone,
                    // keep email from auth if possible, or update it
                }).eq('id', userId)

                // check if address changed or exists
                const { data: existingAddrs } = await supabase.from('addresses').select('id').eq('user_id', userId).limit(1)

                if (existingAddrs && existingAddrs.length > 0) {
                    addressId = existingAddrs[0].id
                    await supabase.from('addresses').update({
                        street: form.street,
                        external_number: form.external_number,
                        internal_number: form.internal_number,
                        postal_code: form.postal_code,
                        neighborhood: form.neighborhood,
                        references_comments: form.references_comments
                    }).eq('id', addressId)
                } else {
                    const { data: newAddr } = await supabase.from('addresses').insert({
                        user_id: userId,
                        street: form.street,
                        external_number: form.external_number,
                        internal_number: form.internal_number,
                        postal_code: form.postal_code,
                        neighborhood: form.neighborhood,
                        references_comments: form.references_comments
                    }).select().single()
                    if (newAddr) addressId = newAddr.id
                }
            } else {
                // Creates guest address
                const { data: newAddr } = await supabase.from('addresses').insert({
                    street: form.street,
                    external_number: form.external_number,
                    internal_number: form.internal_number,
                    postal_code: form.postal_code,
                    neighborhood: form.neighborhood,
                    references_comments: form.references_comments
                }).select().single()
                if (newAddr) addressId = newAddr.id
            }

            // 2. Logic flags — always pending confirmation regardless of shipping
            const bookStatus = 7
            const reservedAt = new Date().toISOString()

            // 3. Create Order
            const { data: order, error: orderError } = await supabase.from('orders').insert({
                user_id: userId || null,
                shipping_address_id: addressId,
                contact_name: form.name,
                contact_email: form.email,
                contact_phone: form.phone,
                total: subtotal,
                shipping_cost: shipping_cost,
                total_with_shipping: total_with_shipping,
                payment_method: form.payment_method,
                status_code: 1
            }).select('id, order_number').single()

            if (orderError) throw orderError

            // 4. Update Books
            const bookIds = cartItems.map(b => b.id)
            const { error: booksError } = await supabase.from('books').update({
                order_id: order.id,
                status_code: bookStatus,
                reserved_at: reservedAt
            }).in('id', bookIds)

            if (booksError) throw booksError

            // 5. Success
            setIsSuccess(true)
            clearCart()
            router.push(`/checkout/success?order=${order.order_number}`)

        } catch (err) {
            console.error(err)
            alert('Ocurrió un error al procesar tu pedido. Por favor intenta de nuevo.')
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>
    }

    if (cartItems.length === 0) return null

    return (
        <div style={{ backgroundColor: '#F5F2E7', minHeight: '100vh', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                {/* Formulario */}
                <div style={{ flex: '1 1 500px' }}>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#1A1A1A', marginBottom: '1.5rem' }}>
                        Completa tu compra
                    </h1>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Datos de Contacto */}
                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1B3022' }}>Datos de Contacto</h2>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Correo Electrónico *</label>
                                    <input required type="email" name="email" value={form.email} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Teléfono / WhatsApp *</label>
                                    <input required type="tel" name="phone" value={form.phone} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Nombre de quien recibe *</label>
                                    <input required type="text" name="name" value={form.name} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none' }} />
                                </div>
                            </div>
                        </div>

                        {/* Datos de Envío */}
                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1B3022' }}>Dirección de Envío</h2>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>Nota: Recuerda que por el momento nuestras entregas son exclusivas en la CDMX.</p>
                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Calle *</label>
                                    <input required type="text" name="street" value={form.street} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Número Exterior *</label>
                                    <input required type="text" name="external_number" value={form.external_number} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Número Interior</label>
                                    <input type="text" name="internal_number" value={form.internal_number} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Código Postal *</label>
                                    <input required type="text" name="postal_code" value={form.postal_code} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Colonia *</label>
                                    {colonias.length > 0 ? (
                                        <select
                                            name="neighborhood"
                                            value={form.neighborhood}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            {colonias.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            required
                                            type="text"
                                            name="neighborhood"
                                            value={form.neighborhood}
                                            onChange={handleInputChange}
                                            placeholder={loadingColonias ? "Buscando colonias..." : "Ingresa CP o escribe tu colonia"}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none' }}
                                        />
                                    )}
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Referencias de entrega</label>
                                    <textarea name="references_comments" value={form.references_comments} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e0ddd2', outline: 'none', resize: 'vertical', minHeight: '80px' }}></textarea>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Resumen */}
                <div style={{ flex: '1 1 350px' }}>
                    <div style={{ position: 'sticky', top: '90px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1A1A1A' }}>Resumen del Pedido</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e0ddd2', paddingBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Montserrat', sans-serif", fontSize: '0.95rem', color: '#555' }}>
                                <span>Subtotal Libros ({cartItems.length}):</span>
                                <strong>${subtotal.toLocaleString('es-MX')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Montserrat', sans-serif", fontSize: '0.95rem', color: '#555' }}>
                                <span>Envío (Solo CDMX):</span>
                                <strong>${shipping_cost.toLocaleString('es-MX')}</strong>
                            </div>
                            {shipping_cost === 0 && (
                                <div style={{ textAlign: 'right', color: '#1B3022', fontSize: '0.75rem', fontWeight: 700 }}>¡Envío Gratis aplicado!</div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Montserrat', sans-serif", fontSize: '1.2rem', color: '#1A1A1A', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e0ddd2' }}>
                                <strong>Total a pagar:</strong>
                                <strong>${total_with_shipping.toLocaleString('es-MX')}</strong>
                            </div>
                        </div>

                        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1A1A1A' }}>Método de Pago</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem' }}>
                                <input type="radio" name="payment_method" value="efectivo" checked={form.payment_method === 'efectivo'} onChange={handleInputChange} style={{ accentColor: '#1B3022', width: '16px', height: '16px' }} />
                                Efectivo contra entrega
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem' }}>
                                <input type="radio" name="payment_method" value="transferencia" checked={form.payment_method === 'transferencia'} onChange={handleInputChange} style={{ accentColor: '#1B3022', width: '16px', height: '16px' }} />
                                Transferencia electrónica
                            </label>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: submitting ? '#999' : '#1B3022',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(27,48,34,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {submitting ? (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '10px' }}>
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                                        </path>
                                    </svg>
                                    GENERANDO PEDIDO... POR FAVOR NO CIERRES LA PÁGINA.
                                </>
                            ) : 'Confirmar pedido'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
