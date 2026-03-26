'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/CartContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const FREE_SHIPPING_THRESHOLD = 499
const SHIPPING_COST = 60

// ─── Inline styles helpers ─────────────────────────────────────
const FONTS = {
    serif: "'Libre Baskerville', 'Playfair Display', serif",
    sans: "'Montserrat', sans-serif",
}
const CLR = {
    cream: '#F5F2E7',
    forest: '#1B3022',
    charcoal: '#1A1A1A',
    darkGray: '#555',
    gold: '#A67C00',
    border: '#ddd9cc',
    white: '#fff',
}

// ─── Field component ───────────────────────────────────────────
function Field({
    label, required = true, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '1.1rem' }}>
            <label style={{
                display: 'block',
                fontFamily: FONTS.sans,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: CLR.charcoal,
                marginBottom: '0.35rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
            }}>
                {label}{required && <span style={{ color: '#c0392b', marginLeft: '3px' }}>*</span>}
            </label>
            {children}
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: '10px',
    border: `1.5px solid ${CLR.border}`,
    fontFamily: FONTS.sans,
    fontSize: '0.9rem',
    color: CLR.charcoal,
    backgroundColor: CLR.white,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
}

// ─── Main Component ────────────────────────────────────────────
export default function CheckoutPage() {
    const router = useRouter()
    const { items, clearCart } = useCart()

    // Form state
    const [form, setForm] = useState({
        email: '',
        phone: '',
        recipientName: '',
        postalCode: '',
        colony: '',
        colonyManual: '',
        street: '',
        extNumber: '',
        intNumber: '',
        paymentMethod: 'transferencia' as 'transferencia' | 'efectivo',
    })
    const [colonies, setColonies] = useState<string[]>([])
    const [coloniesLoading, setColoniesLoading] = useState(false)
    const [coloniesError, setColoniesError] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const cpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const subtotal = items.reduce((sum, i) => sum + i.book.price, 0)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const total = subtotal + shipping

    // ── Redirect if cart is empty ────────────────────────────
    useEffect(() => {
        if (items.length === 0) router.replace('/')
    }, [items, router])

    // ── Postal code → fetch colonies ─────────────────────────
    useEffect(() => {
        const cp = form.postalCode.trim()
        if (cp.length !== 5) {
            setColonies([])
            setColoniesError(false)
            return
        }
        if (cpTimeoutRef.current) clearTimeout(cpTimeoutRef.current)
        cpTimeoutRef.current = setTimeout(async () => {
            setColoniesLoading(true)
            setColoniesError(false)
            try {
                const res = await fetch(
                    `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`,
                    { headers: { Accept: 'application/json' } }
                )
                if (!res.ok) throw new Error()
                const data = await res.json()
                const names: string[] = (data.zip_codes ?? []).map(
                    (z: { d_asenta: string }) => z.d_asenta
                )
                setColonies([...new Set(names)])
                setForm(f => ({ ...f, colony: names[0] ?? '', colonyManual: '' }))
            } catch {
                setColoniesError(true)
                setColonies([])
                setForm(f => ({ ...f, colony: '', colonyManual: '' }))
            } finally {
                setColoniesLoading(false)
            }
        }, 600)
    }, [form.postalCode])

    // ── Validation ────────────────────────────────────────────
    const validate = (): boolean => {
        const e: Record<string, string> = {}
        if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = 'Correo inválido'
        if (form.phone.trim().length < 10) e.phone = 'Mínimo 10 dígitos'
        if (!form.recipientName.trim()) e.recipientName = 'Campo requerido'

        const cpNum = parseInt(form.postalCode.trim(), 10)
        if (form.postalCode.trim().length !== 5 || isNaN(cpNum) || cpNum < 1000 || cpNum > 16999) {
            e.postalCode = 'Solo CDMX (C.P. 01000 a 16999)'
        }

        const colony = coloniesError ? form.colonyManual : form.colony
        if (!colony.trim()) e.colony = 'Selecciona o escribe tu colonia'
        if (!form.street.trim()) e.street = 'Campo requerido'
        if (!form.extNumber.trim()) e.extNumber = 'Campo requerido'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setSubmitting(true)

        const colony = coloniesError ? form.colonyManual : form.colony
        const streetFull = `${form.street} ${form.extNumber}${form.intNumber ? ` Int. ${form.intNumber}` : ''}`

        const itemsSnapshot = items.map(i => ({
            book_id: i.book_id,
            title: i.book.title,
            author: i.book.author,
            price: i.book.price,
        }))

        try {
            const { data, error } = await supabase
                .from('guest_orders')
                .insert({
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    recipient_name: form.recipientName.trim(),
                    postal_code: form.postalCode.trim(),
                    colony,
                    street: streetFull,
                    subtotal,
                    shipping,
                    total,
                    payment_method: form.paymentMethod,
                    items: itemsSnapshot,
                })
                .select('order_number')
                .single()

            if (error) throw error

            clearCart()
            router.push(`/checkout/success?order=${data.order_number}`)
        } catch (err) {
            console.error('Order failed:', err)
            setErrors({ submit: 'Hubo un error al procesar tu pedido. Intenta de nuevo.' })
            setSubmitting(false)
        }
    }

    const set = (field: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(f => ({ ...f, [field]: e.target.value }))

    const errStyle = (field: string): React.CSSProperties => ({
        borderColor: errors[field] ? '#c0392b' : CLR.border,
    })

    return (
        <div style={{ backgroundColor: CLR.cream, minHeight: '100vh', paddingBottom: '4rem' }}>

            {/* ── Page header ── */}
            <div style={{
                backgroundColor: CLR.forest,
                padding: '1.5rem 1.25rem',
                textAlign: 'center',
            }}>
                <h1 style={{
                    fontFamily: FONTS.serif,
                    fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                    fontWeight: 700,
                    color: CLR.cream,
                    margin: 0,
                }}>
                    Finalizar Pedido
                </h1>
                <p style={{
                    fontFamily: FONTS.sans,
                    fontSize: '0.8rem',
                    color: 'rgba(245,242,231,0.65)',
                    marginTop: '0.3rem',
                }}>
                    Solo CDMX • Pago al momento de entrega
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div style={{
                    maxWidth: '960px',
                    margin: '0 auto',
                    padding: '2rem 1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    alignItems: 'start',
                }}>

                    {/* ══════════════════════════════════════
                        LEFT — Form
                    ══════════════════════════════════════ */}
                    <div>
                        <SectionTitle>Datos de Contacto</SectionTitle>

                        <Field label="Correo Electrónico">
                            <input
                                type="email"
                                value={form.email}
                                onChange={set('email')}
                                placeholder="tu@correo.com"
                                style={{ ...inputStyle, ...errStyle('email') }}
                            />
                            {errors.email && <ErrMsg>{errors.email}</ErrMsg>}
                        </Field>

                        <Field label="Teléfono (WhatsApp)">
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={set('phone')}
                                placeholder="55 1234 5678"
                                maxLength={15}
                                style={{ ...inputStyle, ...errStyle('phone') }}
                            />
                            {errors.phone && <ErrMsg>{errors.phone}</ErrMsg>}
                            <span style={{ fontFamily: FONTS.sans, fontSize: '0.72rem', color: '#999', marginTop: '0.25rem', display: 'block' }}>
                                Te contactaremos aquí para confirmar tu pedido.
                            </span>
                        </Field>

                        <Field label="Nombre de quien recibe">
                            <input
                                type="text"
                                value={form.recipientName}
                                onChange={set('recipientName')}
                                placeholder="Nombre completo"
                                style={{ ...inputStyle, ...errStyle('recipientName') }}
                            />
                            {errors.recipientName && <ErrMsg>{errors.recipientName}</ErrMsg>}
                        </Field>

                        <div style={{ marginTop: '1.5rem' }}>
                            <SectionTitle>Dirección de Entrega</SectionTitle>
                        </div>

                        {/* CP + Colony row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem' }}>
                            <Field label="C.P.">
                                <input
                                    type="text"
                                    value={form.postalCode}
                                    onChange={set('postalCode')}
                                    placeholder="06600"
                                    maxLength={5}
                                    inputMode="numeric"
                                    style={{ ...inputStyle, ...errStyle('postalCode') }}
                                />
                                {errors.postalCode && <ErrMsg>{errors.postalCode}</ErrMsg>}
                            </Field>

                            <Field label={coloniesLoading ? 'Colonia (buscando…)' : 'Colonia'}>
                                {!coloniesError && colonies.length > 0 ? (
                                    <select
                                        value={form.colony}
                                        onChange={set('colony')}
                                        style={{ ...inputStyle, ...errStyle('colony'), cursor: 'pointer' }}
                                    >
                                        {colonies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={coloniesError ? form.colonyManual : form.colony}
                                        onChange={coloniesError ? set('colonyManual') : set('colony')}
                                        placeholder={coloniesLoading ? 'Buscando…' : 'Escribe tu colonia'}
                                        disabled={coloniesLoading}
                                        style={{
                                            ...inputStyle,
                                            ...errStyle('colony'),
                                            opacity: coloniesLoading ? 0.6 : 1,
                                        }}
                                    />
                                )}
                                {errors.colony && <ErrMsg>{errors.colony}</ErrMsg>}
                                {coloniesError && (
                                    <span style={{ fontFamily: FONTS.sans, fontSize: '0.72rem', color: '#A67C00', marginTop: '0.25rem', display: 'block' }}>
                                        No encontramos colonias para ese C.P. — escríbela manualmente.
                                    </span>
                                )}
                            </Field>
                        </div>

                        <Field label="Calle">
                            <input
                                type="text"
                                value={form.street}
                                onChange={set('street')}
                                placeholder="Nombre de la calle"
                                style={{ ...inputStyle, ...errStyle('street') }}
                            />
                            {errors.street && <ErrMsg>{errors.street}</ErrMsg>}
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <Field label="Núm. Exterior">
                                <input
                                    type="text"
                                    value={form.extNumber}
                                    onChange={set('extNumber')}
                                    placeholder="42"
                                    style={{ ...inputStyle, ...errStyle('extNumber') }}
                                />
                                {errors.extNumber && <ErrMsg>{errors.extNumber}</ErrMsg>}
                            </Field>
                            <Field label="Núm. Interior" required={false}>
                                <input
                                    type="text"
                                    value={form.intNumber}
                                    onChange={set('intNumber')}
                                    placeholder="Depto. B (opcional)"
                                    style={inputStyle}
                                />
                            </Field>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <SectionTitle>Método de Pago</SectionTitle>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                                    border: `2px solid ${form.paymentMethod === 'transferencia' ? CLR.forest : CLR.border}`,
                                    backgroundColor: form.paymentMethod === 'transferencia' ? 'rgba(27,48,34,0.04)' : CLR.white,
                                    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                                }}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="transferencia"
                                        checked={form.paymentMethod === 'transferencia'}
                                        onChange={(e) => setForm(f => ({ ...f, paymentMethod: 'transferencia' }))}
                                        style={{ width: '18px', height: '18px', accentColor: CLR.forest }}
                                    />
                                    <div style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: '0.9rem', color: CLR.charcoal }}>
                                        Transferencia Bancaria
                                    </div>
                                </label>

                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                                    border: `2px solid ${form.paymentMethod === 'efectivo' ? CLR.forest : CLR.border}`,
                                    backgroundColor: form.paymentMethod === 'efectivo' ? 'rgba(27,48,34,0.04)' : CLR.white,
                                    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                                }}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="efectivo"
                                        checked={form.paymentMethod === 'efectivo'}
                                        onChange={(e) => setForm(f => ({ ...f, paymentMethod: 'efectivo' }))}
                                        style={{ width: '18px', height: '18px', accentColor: CLR.forest }}
                                    />
                                    <div style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: '0.9rem', color: CLR.charcoal }}>
                                        Efectivo
                                    </div>
                                </label>
                            </div>
                        </div>

                        {errors.submit && (
                            <div style={{
                                backgroundColor: '#fff0ee',
                                border: '1px solid #e74c3c',
                                borderRadius: '10px',
                                padding: '0.75rem 1rem',
                                fontFamily: FONTS.sans,
                                fontSize: '0.85rem',
                                color: '#c0392b',
                                marginTop: '0.5rem',
                            }}>
                                {errors.submit}
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════
                        RIGHT — Order summary
                    ══════════════════════════════════════ */}
                    <div style={{ position: 'sticky', top: '80px' }}>
                        <SectionTitle>Resumen de tu Pedido</SectionTitle>

                        {/* Book list */}
                        <div style={{
                            backgroundColor: CLR.white,
                            borderRadius: '14px',
                            overflow: 'hidden',
                            marginBottom: '1rem',
                            boxShadow: '0 2px 12px rgba(27,48,34,0.07)',
                        }}>
                            {items.map(({ book_id, book }) => (
                                <div key={book_id} style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    alignItems: 'center',
                                    padding: '0.85rem 1rem',
                                    borderBottom: `1px solid ${CLR.cream}`,
                                }}>
                                    <div style={{
                                        width: '44px', height: '58px', borderRadius: '6px',
                                        overflow: 'hidden', flexShrink: 0,
                                        backgroundColor: '#e8e4d8',
                                    }}>
                                        {book.image_url
                                            ? <img src={book.image_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📚</div>
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontFamily: FONTS.serif, fontWeight: 700, fontSize: '0.82rem',
                                            color: CLR.charcoal, margin: 0,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>{book.title}</p>
                                        <p style={{
                                            fontFamily: FONTS.sans, fontSize: '0.72rem', color: CLR.darkGray, margin: 0,
                                        }}>{book.author}</p>
                                    </div>
                                    <span style={{
                                        fontFamily: FONTS.sans, fontWeight: 700, fontSize: '0.9rem',
                                        color: CLR.forest, flexShrink: 0,
                                    }}>
                                        ${book.price.toFixed(0)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div style={{
                            backgroundColor: CLR.white,
                            borderRadius: '14px',
                            padding: '1.1rem 1.1rem',
                            boxShadow: '0 2px 12px rgba(27,48,34,0.07)',
                            marginBottom: '1rem',
                        }}>
                            <Row label="Subtotal Libros" value={`$${subtotal.toFixed(0)}`} />
                            <Row
                                label="Envío (Solo CDMX)"
                                value={shipping === 0 ? '¡Gratis!' : `$${shipping.toFixed(2)}`}
                                valueColor={shipping === 0 ? '#1B3022' : undefined}
                            />
                            <div style={{ height: '1px', backgroundColor: CLR.border, margin: '0.75rem 0' }} />
                            <Row label="Total a Pagar" value={`$${total.toFixed(0)}`} bold />

                            {/* Payment method info context removed per user request */}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                backgroundColor: submitting ? '#2a4a34' : CLR.forest,
                                color: CLR.cream,
                                fontFamily: FONTS.sans,
                                fontWeight: 700,
                                fontSize: '1rem',
                                borderRadius: '12px',
                                padding: '1rem',
                                border: 'none',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s',
                                letterSpacing: '0.02em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            {submitting ? (
                                <>
                                    <span style={{
                                        width: '16px', height: '16px',
                                        border: '2.5px solid rgba(245,242,231,0.3)',
                                        borderTopColor: CLR.cream,
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Procesando…
                                </>
                            ) : 'Confirmar Pedido →'}
                        </button>

                        <p style={{
                            fontFamily: FONTS.sans, fontSize: '0.72rem', color: '#aaa',
                            textAlign: 'center', marginTop: '0.75rem',
                        }}>
                            Al confirmar aceptas que nos contactemos contigo por WhatsApp.
                        </p>

                        <Link href="/" style={{
                            display: 'block', textAlign: 'center', marginTop: '0.5rem',
                            fontFamily: FONTS.sans, fontSize: '0.78rem', color: CLR.forest,
                            textDecoration: 'underline',
                        }}>
                            ← Seguir comprando
                        </Link>
                    </div>
                </div>
            </form>

            {/* Spinner keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ─── Small helpers ─────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: '1rem',
            fontWeight: 700,
            color: '#1B3022',
            marginBottom: '1rem',
            paddingBottom: '0.4rem',
            borderBottom: '2px solid rgba(27,48,34,0.12)',
        }}>
            {children}
        </h2>
    )
}

function ErrMsg({ children }: { children: React.ReactNode }) {
    return (
        <span style={{
            display: 'block',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '0.72rem',
            color: '#c0392b',
            marginTop: '0.3rem',
        }}>
            {children}
        </span>
    )
}

function Row({ label, value, bold, valueColor }: {
    label: string; value: string; bold?: boolean; valueColor?: string
}) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '0.5rem',
        }}>
            <span style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: bold ? '0.95rem' : '0.85rem',
                color: bold ? '#1A1A1A' : '#666',
                fontWeight: bold ? 700 : 400,
            }}>{label}</span>
            <span style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: bold ? '1.15rem' : '0.9rem',
                fontWeight: bold ? 700 : 600,
                color: valueColor ?? (bold ? '#1B3022' : '#1A1A1A'),
            }}>{value}</span>
        </div>
    )
}
