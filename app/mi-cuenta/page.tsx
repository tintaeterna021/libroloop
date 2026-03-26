'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7',
    creamDark: '#EDE9D8',
    forest: '#1B3022',
    forestLight: '#2a4a34',
    charcoal: '#1A1A1A',
    darkGray: '#333333',
    mid: '#666',
    border: '#ddd9cc',
    gold: '#A67C00',
    goldBg: 'rgba(166,124,0,0.1)',
    white: '#fff',
    red: '#c0392b',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', 'Playfair Display', serif"

// ─── Order status config ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; color: string }> = {
    pending: {
        label: 'Pendiente de confirmación',
        dot: '🟡',
        bg: 'rgba(255,200,0,0.1)',
        color: '#7A6000',
    },
    confirmed: {
        label: 'Preparando envío',
        dot: '🔵',
        bg: 'rgba(0,100,220,0.08)',
        color: '#0050AA',
    },
    shipped: {
        label: 'En camino',
        dot: '🔵',
        bg: 'rgba(0,100,220,0.08)',
        color: '#0050AA',
    },
    delivered: {
        label: 'Entregado',
        dot: '🟢',
        bg: 'rgba(27,48,34,0.08)',
        color: '#1B3022',
    },
    cancelled: {
        label: 'Cancelado',
        dot: '🔴',
        bg: 'rgba(192,57,43,0.08)',
        color: '#c0392b',
    },
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface GuestOrder {
    id: string
    order_number: string
    email: string
    phone: string
    recipient_name: string
    subtotal: number
    shipping: number
    total: number
    items: { book_id: string; title: string; author: string; price: number; image_url?: string }[]
    status: string
    created_at: string
}

interface Profile {
    id: string
    email: string
    name?: string
    phone?: string
    roles: string[]
}

type Tab = 'compras' | 'ventas' | 'cuenta'

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MiCuentaPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [orders, setOrders] = useState<GuestOrder[]>([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [tab, setTab] = useState<Tab>('compras')
    const [openHistorial, setOpenHistorial] = useState<string | null>(null)

    // Account edit
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')

    useEffect(() => { init() }, [])

    async function init() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: profileData } = await supabase
            .from('profiles').select('*').eq('id', user.id).maybeSingle()

        if (profileData) {
            setProfile(profileData)
            setName(profileData.name || '')
            setPhone(profileData.phone || '')
        } else {
            // Profile not created yet — set minimal profile so page doesn't hang
            setProfile({ id: user.id, email: user.email || '', roles: ['comprador'] } as Profile)
        }

        // Fetch their orders by email
        const email = user.email ?? ''
        const { data: ordersData } = await supabase
            .from('guest_orders')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false })

        setOrders(ordersData || [])
        setLoadingOrders(false)
    }

    async function saveProfile() {
        setSaving(true)
        setSaveMsg('')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { error } = await supabase
            .from('profiles')
            .update({ name, phone })
            .eq('id', user.id)
        setSaveMsg(error ? 'Error al guardar' : '¡Guardado!')
        setTimeout(() => setSaveMsg(''), 3000)
        setSaving(false)
    }

    async function logout() {
        await supabase.auth.signOut()
        router.push('/')
    }

    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    const historyOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')
    const isVendedor = profile?.roles?.includes('vendedor') || profile?.roles?.includes('admin')

    if (!profile) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: SANS, color: C.forest, textAlign: 'center' }}>
                    <div style={{ width: '32px', height: '32px', border: `3px solid rgba(27,48,34,0.2)`, borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 0.75rem' }} />
                    Cargando…
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={{ backgroundColor: C.cream, minHeight: '100vh', paddingBottom: '4rem' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ── Header ── */}
            <div style={{ backgroundColor: C.forest, padding: '1.5rem 1.25rem 0' }}>
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    {/* Greeting */}
                    <p style={{ fontFamily: SANS, fontSize: '0.8rem', color: 'rgba(245,242,231,0.6)', marginBottom: '0.2rem' }}>
                        Bienvenid@,
                    </p>
                    <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 700, color: C.cream, margin: '0 0 1.25rem' }}>
                        {profile.name || profile.email.split('@')[0]} 👋
                    </h1>

                    {/* Tab bar */}
                    <div style={{ display: 'flex', gap: '0' }}>
                        {([
                            { key: 'compras', label: '📦 Mis Compras' },
                            ...(isVendedor ? [{ key: 'ventas', label: '💼 Mis Ventas' }] : []),
                            { key: 'cuenta', label: '⚙️ Cuenta' },
                        ] as { key: Tab; label: string }[]).map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                style={{
                                    fontFamily: SANS,
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    padding: '0.65rem 1.1rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '10px 10px 0 0',
                                    backgroundColor: tab === t.key ? C.cream : 'transparent',
                                    color: tab === t.key ? C.forest : 'rgba(245,242,231,0.6)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.75rem 1.25rem' }}>

                {/* ══════════════ MIS COMPRAS ══════════════ */}
                {tab === 'compras' && (
                    <div>
                        {loadingOrders ? (
                            <Loading />
                        ) : orders.length === 0 ? (
                            <EmptyState
                                icon="🛒"
                                title="Aún no tienes pedidos"
                                sub="Cuando compres un libro, tu historial aparecerá aquí."
                                cta="Ver Catálogo"
                                href="/"
                            />
                        ) : (
                            <>
                                {/* Active orders */}
                                {activeOrders.length > 0 && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <SectionTitle>Pedidos Activos</SectionTitle>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {activeOrders.map(order => (
                                                <ActiveOrderCard key={order.id} order={order} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* History */}
                                {historyOrders.length > 0 && (
                                    <div>
                                        <SectionTitle>Historial de Pedidos</SectionTitle>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {historyOrders.map(order => (
                                                <HistoryRow
                                                    key={order.id}
                                                    order={order}
                                                    isOpen={openHistorial === order.id}
                                                    onToggle={() => setOpenHistorial(prev => prev === order.id ? null : order.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ══════════════ MIS VENTAS ══════════════ */}
                {tab === 'ventas' && isVendedor && (
                    <SellerPanel userId={profile.id} />
                )}

                {/* ══════════════ CUENTA ══════════════ */}
                {tab === 'cuenta' && (
                    <div>
                        <SectionTitle>Información de Cuenta</SectionTitle>

                        <div style={{ backgroundColor: C.white, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(27,48,34,0.07)', marginBottom: '1.25rem' }}>
                            {/* Email (read-only) */}
                            <CField label="Correo Electrónico">
                                <div style={{ ...fieldBase, backgroundColor: C.creamDark, color: C.mid, cursor: 'not-allowed' }}>
                                    {profile.email}
                                </div>
                                <span style={{ fontFamily: SANS, fontSize: '0.7rem', color: '#aaa', marginTop: '0.25rem', display: 'block' }}>No se puede modificar</span>
                            </CField>

                            {/* Name */}
                            <CField label="Nombre completo">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Tu nombre"
                                    style={fieldBase}
                                />
                            </CField>

                            {/* Phone */}
                            <CField label="Teléfono (WhatsApp)">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="+52 55 1234 5678"
                                    style={fieldBase}
                                />
                            </CField>

                            {/* Address (local only for prefill hint) */}
                            <CField label="Dirección de entrega predeterminada" required={false}>
                                <textarea
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Calle, número, colonia, C.P. — para pre-llenar tu próximo pedido"
                                    rows={2}
                                    style={{ ...fieldBase, resize: 'none', lineHeight: 1.5 }}
                                />
                                <span style={{ fontFamily: SANS, fontSize: '0.7rem', color: '#aaa', marginTop: '0.25rem', display: 'block' }}>
                                    Se usará como referencia en tu próximo checkout.
                                </span>
                            </CField>

                            {saveMsg && (
                                <div style={{
                                    backgroundColor: saveMsg.includes('Error') ? '#fff0ee' : 'rgba(27,48,34,0.07)',
                                    borderRadius: '8px', padding: '0.55rem 0.85rem',
                                    fontFamily: SANS, fontSize: '0.8rem',
                                    color: saveMsg.includes('Error') ? C.red : C.forest,
                                    marginBottom: '0.75rem',
                                }}>
                                    {saveMsg}
                                </div>
                            )}

                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    backgroundColor: saving ? C.forestLight : C.forest,
                                    color: C.cream,
                                    fontFamily: SANS, fontWeight: 700,
                                    fontSize: '0.9rem', borderRadius: '12px',
                                    padding: '0.85rem', border: 'none',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                {saving ? 'Guardando…' : 'Guardar Cambios'}
                            </button>
                        </div>

                        {/* Logout */}
                        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                            <button
                                onClick={logout}
                                style={{
                                    background: 'none', border: 'none',
                                    fontFamily: SANS, fontWeight: 600,
                                    fontSize: '0.9rem', color: C.red,
                                    cursor: 'pointer', textDecoration: 'underline',
                                }}
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── ActiveOrderCard ──────────────────────────────────────────────────────────
function ActiveOrderCard({ order }: { order: GuestOrder }) {
    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending

    return (
        <div style={{
            backgroundColor: '#fff', borderRadius: '16px',
            padding: '1.25rem', boxShadow: '0 2px 16px rgba(27,48,34,0.08)',
            border: '1.5px solid #e8e4d8',
        }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', margin: 0 }}>
                        #{order.order_number}
                    </p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', color: '#999', margin: '0.15rem 0 0' }}>
                        {new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                {/* Status pill */}
                <span style={{
                    fontFamily: "'Montserrat', sans-serif", fontWeight: 600,
                    fontSize: '0.72rem', borderRadius: '999px',
                    padding: '0.3rem 0.75rem',
                    backgroundColor: cfg.bg, color: cfg.color,
                }}>
                    {cfg.dot} {cfg.label}
                </span>
            </div>

            {/* Book thumbnails */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                {order.items.map((item, i) => (
                    <div key={i} style={{
                        width: '44px', height: '58px', borderRadius: '6px',
                        overflow: 'hidden', backgroundColor: '#e8e4d8', flexShrink: 0,
                    }}>
                        {item.image_url
                            ? <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📚</div>
                        }
                    </div>
                ))}
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0ece0', paddingTop: '0.75rem' }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#666' }}>
                    {order.items.length} {order.items.length === 1 ? 'libro' : 'libros'}
                </span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#1B3022' }}>
                    Total: ${order.total.toFixed(0)}
                </span>
            </div>
        </div>
    )
}

// ─── HistoryRow (accordion) ───────────────────────────────────────────────────
function HistoryRow({ order, isOpen, onToggle }: { order: GuestOrder; isOpen: boolean; onToggle: () => void }) {
    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.delivered
    return (
        <div style={{
            backgroundColor: '#fff', borderRadius: '12px',
            border: '1.5px solid #e8e4d8', overflow: 'hidden',
        }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%', padding: '0.9rem 1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
            >
                <div>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: '#1A1A1A' }}>
                        #{order.order_number}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', color: '#999', marginLeft: '0.6rem' }}>
                        {new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        fontFamily: "'Montserrat', sans-serif", fontSize: '0.7rem', fontWeight: 600,
                        backgroundColor: cfg.bg, color: cfg.color,
                        padding: '0.2rem 0.6rem', borderRadius: '999px',
                    }}>
                        {cfg.dot} {cfg.label}
                    </span>
                    <span style={{ color: '#bbb', fontSize: '0.8rem', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                </div>
            </button>

            {isOpen && (
                <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #f0ece0' }}>
                    <div style={{ paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {order.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#333' }}>
                                    📚 {item.title}
                                </span>
                                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#1B3022' }}>
                                    ${item.price.toFixed(0)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e8e4d8', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#666' }}>Total</span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#1B3022' }}>
                            ${order.total.toFixed(0)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── SellerPanel (full) ──────────────────────────────────────────────────────
interface SellerBook {
    id: string
    title: string
    author: string
    price: number
    status: string
    image_url?: string
    rejection_reason?: string
}

const BOOK_STATUS: Record<string, {
    icon: string; label: string; sub: string
    color: string; bg: string; border: string; highlight?: boolean
}> = {
    revision: {
        icon: '⏳', label: 'En revisión',
        sub: 'Estamos analizando las fotos (Máx. 24 hrs).',
        color: '#7A6000', bg: 'rgba(255,200,0,0.08)', border: 'rgba(255,200,0,0.25)',
    },
    available: {
        icon: '✅', label: 'Publicado / En Venta',
        sub: 'Publicado en ${price}',           // filled at runtime
        color: '#1B3022', bg: 'rgba(27,48,34,0.06)', border: 'rgba(27,48,34,0.2)',
    },
    sold: {
        icon: '🎉', label: 'Vendido',
        sub: 'Este libro ya tiene nuevo dueño. Tu saldo se actualizará pronto.',
        color: '#7A5C00', bg: 'rgba(166,124,0,0.1)', border: 'rgba(166,124,0,0.3)',
        highlight: true,
    },
    rejected: {
        icon: '❌', label: 'No Aprobado',
        sub: 'No cumple con nuestros criterios de calidad o año de edición.',
        color: '#c0392b', bg: 'rgba(192,57,43,0.06)', border: 'rgba(192,57,43,0.2)',
    },
}

function SellerPanel({ userId }: { userId: string }) {
    const [books, setBooks] = useState<SellerBook[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        supabase.from('books')
            .select('id,title,author,price,status,image_url,rejection_reason')
            .eq('seller_id', userId)
            .order('created_at', { ascending: false })
            .then(({ data }) => { setBooks(data || []); setLoading(false) })
    }, [userId])

    if (loading) return <Loading />

    // ── Stats computation ──────────────────────────────────────────────
    const soldBooks = books.filter(b => b.status === 'sold')
    const totalEarnings = soldBooks.reduce((s, b) => s + (b.price ?? 0), 0)
    // Pending = sold in current month (simplified: all sold until payout date)
    const pendingBalance = totalEarnings   // simplified; real impl tracks payouts
    const soldCount = soldBooks.length

    return (
        <div style={{ position: 'relative', paddingBottom: '5rem' }}>

            {/* ── Earnings cards ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.75rem' }}>
                <EarningsCard
                    label="Ganancias Totales"
                    value={`$${totalEarnings.toFixed(0)}`}
                    icon="💰"
                    accent="#1B3022"
                />
                <EarningsCard
                    label="Saldo Pendiente"
                    value={`$${pendingBalance.toFixed(0)}`}
                    icon="⏳"
                    accent="#A67C00"
                    footnote="Cortes: días 15 y 30"
                />
                <EarningsCard
                    label="Libros Vendidos"
                    value={String(soldCount)}
                    icon="📚"
                    accent="#0050AA"
                />
            </div>

            {/* ── Book list ──────────────────────────────────────────── */}
            <SectionTitle>Estado del Inventario</SectionTitle>

            {books.length === 0 ? (
                <EmptyState
                    icon="📖"
                    title="Aún no tienes libros registrados"
                    sub="Cuando el equipo de Libroloop publique tus libros, aparecerán aquí."
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {books.map(book => {
                        const cfg = BOOK_STATUS[book.status] ?? BOOK_STATUS.revision
                        const subText = book.status === 'available'
                            ? `Publicado en $${book.price?.toFixed(0)}`
                            : book.status === 'rejected' && book.rejection_reason
                                ? `${cfg.sub} — "${book.rejection_reason}"`
                                : cfg.sub

                        return (
                            <div key={book.id} style={{
                                backgroundColor: cfg.highlight ? 'rgba(166,124,0,0.04)' : '#fff',
                                borderRadius: '14px',
                                border: `1.5px solid ${cfg.border}`,
                                padding: '0.9rem 1rem',
                                display: 'flex',
                                gap: '0.85rem',
                                alignItems: 'center',
                            }}>
                                {/* Thumbnail */}
                                <div style={{ width: '44px', height: '58px', borderRadius: '7px', overflow: 'hidden', backgroundColor: '#e8e4d8', flexShrink: 0 }}>
                                    {book.image_url
                                        ? <img src={book.image_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📚</div>
                                    }
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.85rem', color: '#1A1A1A', margin: '0 0 0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {book.title}
                                    </p>
                                    <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: '#999', margin: '0 0 0.4rem' }}>
                                        {book.author}
                                    </p>
                                    {/* Status pill + sub-message */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontFamily: SANS, fontWeight: 700, fontSize: '0.68rem',
                                            padding: '0.2rem 0.55rem', borderRadius: '999px',
                                            backgroundColor: cfg.bg, color: cfg.color,
                                            flexShrink: 0,
                                        }}>
                                            {cfg.icon} {cfg.label}
                                        </span>
                                        {book.status === 'rejected' && (
                                            <span title={book.rejection_reason || cfg.sub}
                                                style={{ fontSize: '0.85rem', cursor: 'help', color: '#c0392b' }}>
                                                ℹ️
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: cfg.color, margin: '0.3rem 0 0', lineHeight: 1.4 }}>
                                        {subText}
                                    </p>
                                </div>

                                {/* Price (only if available/sold) */}
                                {(book.status === 'available' || book.status === 'sold') && (
                                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                        <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.95rem', color: cfg.highlight ? '#A67C00' : '#1B3022', margin: 0 }}>
                                            ${book.price?.toFixed(0)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Legal link ─────────────────────────────────────────── */}
            <p style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <a
                    href="/contrato-consignacion.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: SANS, fontSize: '0.72rem', color: '#aaa', textDecoration: 'underline' }}
                >
                    Ver mi contrato de consignación (24 meses)
                </a>
            </p>

            {/* ── Floating CTA ───────────────────────────────────────── */}
            <div style={{
                position: 'sticky',
                bottom: '1.25rem',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 10,
            }}>
                <button
                    onClick={() => router.push('/vender')}
                    style={{
                        pointerEvents: 'all',
                        backgroundColor: '#1B3022',
                        color: '#F5F2E7',
                        fontFamily: SANS,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        borderRadius: '999px',
                        padding: '0.85rem 1.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 6px 24px rgba(27,48,34,0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(27,48,34,0.45)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(27,48,34,0.35)' }}
                >
                    <span style={{ fontSize: '1.1rem' }}>+</span> Vender más libros
                </button>
            </div>
        </div>
    )
}

// ─── EarningsCard ─────────────────────────────────────────────────────────────
function EarningsCard({ label, value, icon, accent, footnote }: {
    label: string; value: string; icon: string; accent: string; footnote?: string
}) {
    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '14px',
            padding: '0.85rem 0.75rem',
            boxShadow: '0 2px 10px rgba(27,48,34,0.07)',
            border: '1.5px solid #e8e4d8',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{icon}</div>
            <div style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                color: accent,
                lineHeight: 1.1,
                marginBottom: '0.3rem',
            }}>
                {value}
            </div>
            <div style={{ fontFamily: SANS, fontSize: '0.65rem', color: '#888', lineHeight: 1.3 }}>
                {label}
            </div>
            {footnote && (
                <div style={{ fontFamily: SANS, fontSize: '0.6rem', color: '#bbb', marginTop: '0.3rem' }}>
                    {footnote}
                </div>
            )}
        </div>
    )
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: C.forest, marginBottom: '1rem', paddingBottom: '0.35rem', borderBottom: `2px solid rgba(27,48,34,0.12)` }}>
            {children}
        </h2>
    )
}

function CField({ label, children, required = true }: { label: string; children: React.ReactNode; required?: boolean }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontFamily: SANS, fontSize: '0.74rem', fontWeight: 600, color: C.charcoal, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}{required && <span style={{ color: C.red, marginLeft: '3px' }}>*</span>}
            </label>
            {children}
        </div>
    )
}

function Loading() {
    return (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: C.mid, fontFamily: SANS }}>
            <div style={{ width: '28px', height: '28px', border: `3px solid rgba(27,48,34,0.15)`, borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 0.75rem' }} />
            Cargando…
        </div>
    )
}

function EmptyState({ icon, title, sub, cta, href }: { icon: string; title: string; sub: string; cta?: string; href?: string }) {
    const router = useRouter()
    return (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e8e4d8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{icon}</div>
            <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1rem', color: C.charcoal, marginBottom: '0.4rem' }}>{title}</p>
            <p style={{ fontFamily: SANS, fontSize: '0.8rem', color: C.mid, marginBottom: cta ? '1.25rem' : 0 }}>{sub}</p>
            {cta && href && (
                <button onClick={() => router.push(href)} style={{ backgroundColor: C.forest, color: C.cream, fontFamily: SANS, fontWeight: 700, fontSize: '0.85rem', borderRadius: '10px', padding: '0.65rem 1.5rem', border: 'none', cursor: 'pointer' }}>
                    {cta}
                </button>
            )}
        </div>
    )
}

const fieldBase: React.CSSProperties = {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: '10px',
    border: `1.5px solid ${C.border}`,
    fontFamily: SANS,
    fontSize: '0.9rem',
    color: C.charcoal,
    backgroundColor: '#FAFAF6',
    outline: 'none',
    boxSizing: 'border-box',
}
