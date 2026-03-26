'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7',
    creamDark: '#EDE9D8',
    forest: '#1B3022',
    forestLight: '#2a4a34',
    charcoal: '#1A1A1A',
    mid: '#666',
    border: '#ddd9cc',
    gold: '#A67C00',
    goldBg: 'rgba(166,124,0,0.1)',
    white: '#fff',
    red: '#c0392b',
    blue: '#0050AA',
    blueBg: 'rgba(0,80,170,0.08)',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', 'Playfair Display', serif"

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'dashboard'
const TABS: { key: Tab; icon: string; label: string; href?: string }[] = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'dashboard', icon: '📥', label: 'Lotes', href: '/admin/lotes' },
    { key: 'dashboard', icon: '📦', label: 'Pedidos', href: '/admin/pedidos' },
    { key: 'dashboard', icon: '📚', label: 'Inventario', href: '/admin/inventario' },
    { key: 'dashboard', icon: '💰', label: 'Finanzas', href: '/admin/finanzas' },
    { key: 'dashboard', icon: '🧑‍💼', label: 'CRM', href: '/admin/crm' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [tab, setTab] = useState<Tab>('dashboard')

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { router.push('/login'); return }
            const { data: profile } = await supabase.from('profiles').select('roles').eq('id', user.id).single()
            if (!JSON.stringify(profile?.roles || []).includes('admin')) { router.push('/'); return }
            setChecking(false)
        })
    }, [router])

    if (checking) return <Spinner />

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: C.cream }}>

            {/* ── Sidebar ── */}
            <aside style={{
                width: '200px', flexShrink: 0,
                backgroundColor: C.forest,
                display: 'flex', flexDirection: 'column',
                position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
            }}>
                {/* Logo */}
                <div style={{ padding: '1.5rem 1rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                    <p style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: C.cream, margin: 0 }}>Libroloop</p>
                    <p style={{ fontFamily: SANS, fontSize: '0.65rem', color: 'rgba(245,242,231,0.5)', margin: '0.15rem 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin</p>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '0.75rem 0' }}>
                    {TABS.map((t, i) => (
                        <button key={i} onClick={() => t.href ? router.push(t.href) : setTab(t.key)} style={{
                            width: '100%', textAlign: 'left',
                            padding: '0.7rem 1rem',
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            background: (!t.href && tab === t.key) ? 'rgba(245,242,231,0.12)' : 'none',
                            borderLeft: (!t.href && tab === t.key) ? `3px solid ${C.gold}` : '3px solid transparent',
                            border: 'none', cursor: 'pointer',
                            fontFamily: SANS, fontWeight: (!t.href && tab === t.key) ? 700 : 400,
                            fontSize: '0.82rem',
                            color: (!t.href && tab === t.key) ? C.cream : 'rgba(245,242,231,0.6)',
                            transition: 'all 0.15s',
                        }}>
                            <span>{t.icon}</span> {t.label}
                        </button>
                    ))}
                </nav>

                {/* Back to site */}
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={() => router.push('/')} style={{ fontFamily: SANS, fontSize: '0.72rem', color: 'rgba(245,242,231,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ← Ir al sitio
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main style={{ flex: 1, padding: '2rem 1.75rem', overflowY: 'auto', maxWidth: '100%' }}>
                {tab === 'dashboard' && <DashboardPanel />}
            </main>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function DashboardPanel() {
    const [stats, setStats] = useState({
        dayRevenue: 0, weekRevenue: 0,
        pendingOrders: 0, pendingLotes: 0, activeBooks: 0,
    })
    const [recentOrders, setRecentOrders] = useState<GuestOrder[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const now = new Date()
            const dayAgo = new Date(now); dayAgo.setDate(dayAgo.getDate() - 1)
            const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)

            const [ordersRes, booksRes, pendingRes, lotesRes, recentRes] = await Promise.all([
                supabase.from('guest_orders').select('total,created_at'),
                supabase.from('books').select('*', { count: 'exact', head: true }).eq('status', 'available'),
                supabase.from('guest_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('books').select('*', { count: 'exact', head: true }).eq('status', 'revision'),
                supabase.from('guest_orders').select('*').order('created_at', { ascending: false }).limit(5),
            ])

            const orders = ordersRes.data || []
            const dayRev = orders.filter(o => new Date(o.created_at) >= dayAgo).reduce((s, o) => s + (o.total || 0), 0)
            const weekRev = orders.filter(o => new Date(o.created_at) >= weekAgo).reduce((s, o) => s + (o.total || 0), 0)

            setStats({
                dayRevenue: dayRev, weekRevenue: weekRev,
                pendingOrders: pendingRes.count || 0,
                pendingLotes: lotesRes.count || 0,
                activeBooks: booksRes.count || 0,
            })
            setRecentOrders(recentRes.data || [])
            setLoading(false)
        }
        load()
    }, [])

    if (loading) return <Spinner />

    const kpis = [
        { icon: '📅', label: 'Ventas Hoy', value: `$${stats.dayRevenue.toFixed(0)}`, accent: C.forest },
        { icon: '📆', label: 'Ventas Esta Semana', value: `$${stats.weekRevenue.toFixed(0)}`, accent: C.forest },
        { icon: '📦', label: 'Pedidos Pendientes', value: String(stats.pendingOrders), accent: stats.pendingOrders > 0 ? '#A67C00' : C.forest, urgent: stats.pendingOrders > 0 },
        { icon: '📥', label: 'Lotes en Revisión', value: String(stats.pendingLotes), accent: stats.pendingLotes > 0 ? C.blue : C.forest, urgent: stats.pendingLotes > 0 },
        { icon: '📚', label: 'Libros Activos', value: String(stats.activeBooks), accent: C.forest },
    ]

    return (
        <div>
            <PageTitle icon="📊">Dashboard</PageTitle>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
                {kpis.map((k, i) => (
                    <div key={i} style={{
                        backgroundColor: C.white,
                        borderRadius: '14px',
                        padding: '1.1rem',
                        border: k.urgent ? `2px solid ${k.accent}` : `1.5px solid ${C.border}`,
                        boxShadow: '0 2px 10px rgba(27,48,34,0.06)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{k.icon}</div>
                        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.6rem', color: k.accent, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid, marginTop: '0.3rem', lineHeight: 1.3 }}>{k.label}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Pedidos Recientes</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentOrders.length === 0
                    ? <Empty text="No hay pedidos todavía." />
                    : recentOrders.map(o => <OrderRow key={o.id} order={o} compact />)
                }
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. LOTES (batch review)
// ══════════════════════════════════════════════════════════════════════════════
function LotesPanel() {
    const [books, setBooks] = useState<BookRow[]>([])
    const [loading, setLoading] = useState(true)
    const [actionMsg, setActionMsg] = useState('')

    useEffect(() => { loadRevision() }, [])

    async function loadRevision() {
        const { data } = await supabase
            .from('books')
            .select('id,title,author,price,status,image_url,seller_id,profiles(name,email,phone)')
            .eq('status', 'revision')
            .order('created_at', { ascending: true })
        setBooks((data as BookRow[]) || [])
        setLoading(false)
    }

    async function approve(book: BookRow, price: number) {
        await supabase.from('books').update({ status: 'available', price }).eq('id', book.id)
        setBooks(prev => prev.filter(b => b.id !== book.id))
        setActionMsg(`✅ "${book.title}" publicado a $${price}`)
        setTimeout(() => setActionMsg(''), 3000)
    }

    async function reject(book: BookRow, reason: string) {
        await supabase.from('books').update({ status: 'rejected', rejection_reason: reason }).eq('id', book.id)
        setBooks(prev => prev.filter(b => b.id !== book.id))
        setActionMsg(`❌ "${book.title}" rechazado`)
        setTimeout(() => setActionMsg(''), 3000)
    }

    if (loading) return <Spinner />

    return (
        <div>
            <PageTitle icon="📥">Aprobación de Lotes</PageTitle>
            {actionMsg && <Toast msg={actionMsg} />}
            {books.length === 0
                ? <Empty text="No hay lotes esperando revisión. ¡Todo al día! 🎉" />
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {books.map(b => <LoteCard key={b.id} book={b} onApprove={approve} onReject={reject} />)}
                </div>
            }
        </div>
    )
}

function LoteCard({ book, onApprove, onReject }: { book: BookRow; onApprove: (b: BookRow, p: number) => void; onReject: (b: BookRow, r: string) => void }) {
    const [price, setPrice] = useState(book.price || 150)
    const [rejectReason, setRejectReason] = useState('')
    const [showReject, setShowReject] = useState(false)

    // WhatsApp message generator
    const waMsg = encodeURIComponent(
        `📚 *Libroloop — Revisión de tu lote*\n\nHola! Ya analizamos tu libro:\n*${book.title}* — ${book.author}\n\n✅ Lo publicaremos en $${price} MXN\n\nGracias por confiar en Libroloop 📖`
    )
    const waPhone = (book as any).profiles?.phone?.replace(/\D/g, '') || ''

    return (
        <div style={{ backgroundColor: C.white, borderRadius: '14px', padding: '1.25rem', border: `1.5px solid ${C.border}`, boxShadow: '0 2px 10px rgba(27,48,34,0.06)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                {/* Thumbnail */}
                <div style={{ width: '52px', height: '68px', borderRadius: '8px', overflow: 'hidden', backgroundColor: C.creamDark, flexShrink: 0 }}>
                    {book.image_url
                        ? <img src={book.image_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📚</div>
                    }
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.95rem', color: C.charcoal, margin: '0 0 0.15rem' }}>{book.title}</p>
                    <p style={{ fontFamily: SANS, fontSize: '0.75rem', color: C.mid, margin: '0 0 0.25rem' }}>{book.author}</p>
                    <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, margin: 0 }}>
                        Vendedor: <strong>{(book as any).profiles?.name || (book as any).profiles?.email || '—'}</strong>
                        {(book as any).profiles?.phone && ` · ${(book as any).profiles.phone}`}
                    </p>
                </div>
            </div>

            {/* Price + approve */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', border: `1.5px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: C.creamDark }}>
                    <span style={{ fontFamily: SANS, fontSize: '0.85rem', fontWeight: 700, color: C.forest, paddingLeft: '0.7rem' }}>$</span>
                    <input
                        type="number"
                        value={price}
                        onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                        style={{ width: '70px', padding: '0.5rem 0.5rem', border: 'none', background: 'transparent', fontFamily: SANS, fontSize: '0.85rem', color: C.charcoal, outline: 'none' }}
                    />
                </div>

                <ActionBtn color={C.forest} onClick={() => onApprove(book, price)}>✅ Aprobar</ActionBtn>
                <ActionBtn color={C.red} subtle onClick={() => setShowReject(v => !v)}>❌ Rechazar</ActionBtn>

                {waPhone && (
                    <a href={`https://wa.me/${waPhone}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: SANS, fontSize: '0.75rem', fontWeight: 600, color: '#25D366', textDecoration: 'none', padding: '0.45rem 0.75rem', border: '1.5px solid #25D366', borderRadius: '8px' }}>
                        💬 WhatsApp vendedor
                    </a>
                )}
            </div>

            {showReject && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Razón de rechazo (opcional)"
                        style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: '0.82rem', outline: 'none' }}
                    />
                    <ActionBtn color={C.red} onClick={() => onReject(book, rejectReason)}>Confirmar</ActionBtn>
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. PEDIDOS
// ══════════════════════════════════════════════════════════════════════════════
const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
const ORDER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '🟡 Pendiente', color: '#7A6000', bg: 'rgba(255,200,0,0.1)' },
    confirmed: { label: '🔵 Preparando envío', color: C.blue, bg: C.blueBg },
    shipped: { label: '🚚 En camino', color: C.blue, bg: C.blueBg },
    delivered: { label: '🟢 Entregado', color: C.forest, bg: 'rgba(27,48,34,0.08)' },
    cancelled: { label: '🔴 Cancelado', color: C.red, bg: 'rgba(192,57,43,0.07)' },
}

function PedidosPanel() {
    const [orders, setOrders] = useState<GuestOrder[]>([])
    const [filter, setFilter] = useState<string>('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.from('guest_orders').select('*').order('created_at', { ascending: false })
            .then(({ data }) => { setOrders(data || []); setLoading(false) })
    }, [])

    async function changeStatus(id: string, status: string) {
        await supabase.from('guest_orders').update({ status }).eq('id', id)
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    }

    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

    if (loading) return <Spinner />

    return (
        <div>
            <PageTitle icon="📦">Gestión de Pedidos</PageTitle>

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {['all', ...ORDER_STATUSES].map(s => (
                    <button key={s} onClick={() => setFilter(s)} style={{
                        fontFamily: SANS, fontWeight: 600, fontSize: '0.75rem',
                        padding: '0.35rem 0.85rem', borderRadius: '999px',
                        border: `1.5px solid ${filter === s ? C.forest : C.border}`,
                        backgroundColor: filter === s ? C.forest : C.white,
                        color: filter === s ? C.cream : C.mid,
                        cursor: 'pointer',
                    }}>
                        {s === 'all' ? '🗂 Todos' : ORDER_LABELS[s]?.label ?? s}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.length === 0
                    ? <Empty text="No hay pedidos con ese filtro." />
                    : filtered.map(o => <OrderRow key={o.id} order={o} onChangeStatus={changeStatus} />)
                }
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. INVENTARIO
// ══════════════════════════════════════════════════════════════════════════════
function InventarioPanel() {
    const [books, setBooks] = useState<BookRow[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<string | null>(null)
    const [editData, setEditData] = useState<{ price: number; status: string }>({ price: 0, status: 'available' })
    const [saveMsg, setSaveMsg] = useState('')

    useEffect(() => { loadBooks() }, [])

    async function loadBooks() {
        const { data } = await supabase.from('books')
            .select('id,title,author,price,status,image_url,seller_id,profiles(name,email)')
            .in('status', ['available', 'sold', 'revision', 'rejected'])
            .order('created_at', { ascending: false })
        setBooks((data as BookRow[]) || [])
        setLoading(false)
    }

    async function saveEdit(id: string) {
        await supabase.from('books').update(editData).eq('id', id)
        setBooks(prev => prev.map(b => b.id === id ? { ...b, ...editData } : b))
        setEditing(null)
        setSaveMsg('Guardado ✓')
        setTimeout(() => setSaveMsg(''), 2500)
    }

    const filtered = books.filter(b =>
        b.title?.toLowerCase().includes(search.toLowerCase()) ||
        b.author?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <Spinner />

    return (
        <div>
            <PageTitle icon="📚">Inventario General</PageTitle>
            {saveMsg && <Toast msg={saveMsg} />}

            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por título o autor…"
                style={{ ...searchStyle, marginBottom: '1.25rem' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {filtered.length === 0
                    ? <Empty text="No se encontraron libros." />
                    : filtered.map(book => (
                        <div key={book.id} style={{ backgroundColor: C.white, borderRadius: '12px', padding: '0.85rem 1rem', border: `1.5px solid ${C.border}`, display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '52px', borderRadius: '6px', overflow: 'hidden', backgroundColor: C.creamDark, flexShrink: 0 }}>
                                {book.image_url ? <img src={book.image_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📚</div>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.85rem', color: C.charcoal, margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
                                <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid, margin: 0 }}>{book.author}</p>
                            </div>

                            {editing === book.id ? (
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                                    <input type="number" value={editData.price} onChange={e => setEditData(d => ({ ...d, price: parseFloat(e.target.value) || 0 }))}
                                        style={{ width: '75px', padding: '0.4rem 0.5rem', border: `1.5px solid ${C.border}`, borderRadius: '7px', fontFamily: SANS, fontSize: '0.82rem', outline: 'none' }} />
                                    <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
                                        style={{ padding: '0.4rem 0.5rem', border: `1.5px solid ${C.border}`, borderRadius: '7px', fontFamily: SANS, fontSize: '0.75rem', outline: 'none' }}>
                                        <option value="available">Disponible</option>
                                        <option value="sold">Vendido</option>
                                        <option value="revision">En revisión</option>
                                        <option value="rejected">Rechazado</option>
                                    </select>
                                    <ActionBtn color={C.forest} onClick={() => saveEdit(book.id)}>✓</ActionBtn>
                                    <ActionBtn color={C.mid} subtle onClick={() => setEditing(null)}>✕</ActionBtn>
                                </div>
                            ) : (
                                <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                                    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.9rem', color: C.forest }}>${book.price?.toFixed(0)}</span>
                                    <StatusPill status={book.status} />
                                    <button onClick={() => { setEditing(book.id); setEditData({ price: book.price || 0, status: book.status }) }}
                                        style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. FINANZAS
// ══════════════════════════════════════════════════════════════════════════════
interface SellerBalance {
    seller_id: string
    name: string
    email: string
    phone: string
    books: { id: string; title: string; price: number; paid: boolean }[]
}

function FinanzasPanel() {
    const [sellers, setSellers] = useState<SellerBalance[]>([])
    const [loading, setLoading] = useState(true)
    const [actionMsg, setActionMsg] = useState('')

    useEffect(() => { loadFinanzas() }, [])

    async function loadFinanzas() {
        // Get all sold books with seller info
        const { data: soldBooks } = await supabase
            .from('books')
            .select('id,title,price,seller_id,paid_out,profiles(id,name,email,phone)')
            .eq('status', 'sold')

        if (!soldBooks) { setLoading(false); return }

        // Group by seller
        const map: Record<string, SellerBalance> = {}
        soldBooks.forEach((b: any) => {
            const sid = b.seller_id
            if (!sid) return
            if (!map[sid]) {
                map[sid] = {
                    seller_id: sid,
                    name: b.profiles?.name || b.profiles?.email || 'Sin nombre',
                    email: b.profiles?.email || '',
                    phone: b.profiles?.phone || '',
                    books: [],
                }
            }
            map[sid].books.push({ id: b.id, title: b.title, price: b.price, paid: !!b.paid_out })
        })

        setSellers(Object.values(map))
        setLoading(false)
    }

    async function markPaid(sellerId: string) {
        const unpaidIds = sellers.find(s => s.seller_id === sellerId)?.books.filter(b => !b.paid).map(b => b.id) || []
        if (unpaidIds.length === 0) return
        await supabase.from('books').update({ paid_out: true }).in('id', unpaidIds)
        setSellers(prev => prev.map(s =>
            s.seller_id === sellerId
                ? { ...s, books: s.books.map(b => ({ ...b, paid: true })) }
                : s
        ))
        setActionMsg('✅ Pago registrado correctamente')
        setTimeout(() => setActionMsg(''), 3000)
    }

    if (loading) return <Spinner />

    return (
        <div>
            <PageTitle icon="💰">Finanzas y Pagos a Vendedores</PageTitle>
            <p style={{ fontFamily: SANS, fontSize: '0.8rem', color: C.mid, marginBottom: '1.25rem' }}>
                Cortes de pago los <strong>días 15 y 30</strong> de cada mes.
            </p>
            {actionMsg && <Toast msg={actionMsg} />}

            {sellers.length === 0
                ? <Empty text="No hay libros vendidos aún." />
                : sellers.map(seller => {
                    const unpaidBooks = seller.books.filter(b => !b.paid)
                    const paidBooks = seller.books.filter(b => b.paid)
                    const balance = unpaidBooks.reduce((s, b) => s + (b.price || 0), 0)
                    const totalEarned = seller.books.reduce((s, b) => s + (b.price || 0), 0)

                    return (
                        <div key={seller.seller_id} style={{ backgroundColor: C.white, borderRadius: '14px', padding: '1.25rem', border: `1.5px solid ${C.border}`, marginBottom: '0.85rem', boxShadow: '0 2px 10px rgba(27,48,34,0.05)' }}>
                            {/* Seller header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1rem', color: C.charcoal, margin: '0 0 0.15rem' }}>{seller.name}</p>
                                    <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, margin: 0 }}>{seller.email}{seller.phone && ` · ${seller.phone}`}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.3rem', color: balance > 0 ? C.gold : C.mid, margin: '0 0 0.15rem' }}>${balance.toFixed(0)}</p>
                                    <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, margin: 0 }}>Saldo pendiente · Total: ${totalEarned.toFixed(0)}</p>
                                </div>
                            </div>

                            {/* Book list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.85rem' }}>
                                {seller.books.map(b => (
                                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0' }}>
                                        <span style={{ fontFamily: SANS, fontSize: '0.78rem', color: b.paid ? '#aaa' : C.charcoal }}>
                                            {b.paid ? '✓ ' : '• '}{b.title}
                                        </span>
                                        <span style={{ fontFamily: SANS, fontSize: '0.78rem', fontWeight: 600, color: b.paid ? '#aaa' : C.forest }}>
                                            ${b.price?.toFixed(0)}{b.paid && ' (pagado)'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {unpaidBooks.length > 0 && (
                                    <ActionBtn color={C.forest} onClick={() => markPaid(seller.seller_id)}>
                                        Marcar como Pagado (${balance.toFixed(0)})
                                    </ActionBtn>
                                )}
                                {seller.phone && (
                                    <a href={`https://wa.me/${seller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${seller.name}! Te realizamos el pago de $${balance.toFixed(0)} por ${unpaidBooks.length} libro(s) vendidos en Libroloop 📚`)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        style={{ fontFamily: SANS, fontSize: '0.75rem', fontWeight: 600, color: '#25D366', textDecoration: 'none', padding: '0.45rem 0.75rem', border: '1.5px solid #25D366', borderRadius: '8px' }}>
                                        💬 Notificar por WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                })}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. USUARIOS
// ══════════════════════════════════════════════════════════════════════════════
function UsuariosPanel() {
    const [users, setUsers] = useState<{ id: string; name?: string; email: string; phone?: string; roles: string[]; created_at: string }[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.from('profiles').select('id,name,email,phone,roles,created_at')
            .order('created_at', { ascending: false })
            .then(({ data }) => { setUsers(data || []); setLoading(false) })
    }, [])

    const filtered = users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <Spinner />

    const sellers = users.filter(u => u.roles?.includes('vendedor'))
    const buyers = users.filter(u => !u.roles?.includes('vendedor') && !u.roles?.includes('admin'))

    return (
        <div>
            <PageTitle icon="👥">Directorio de Usuarios</PageTitle>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total', value: users.length, color: C.forest },
                    { label: 'Compradores', value: buyers.length, color: C.blue },
                    { label: 'Vendedores', value: sellers.length, color: C.gold },
                ].map((s, i) => (
                    <div key={i} style={{ backgroundColor: C.white, borderRadius: '10px', padding: '0.65rem 1rem', border: `1.5px solid ${C.border}`, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.2rem', color: s.color }}>{s.value}</span>
                        <span style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid }}>{s.label}</span>
                    </div>
                ))}
            </div>

            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo…"
                style={{ ...searchStyle, marginBottom: '1rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filtered.length === 0
                    ? <Empty text="No se encontraron usuarios." />
                    : filtered.map(u => (
                        <div key={u.id} style={{ backgroundColor: C.white, borderRadius: '11px', padding: '0.85rem 1rem', border: `1.5px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div>
                                <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.85rem', color: C.charcoal, margin: '0 0 0.1rem' }}>{u.name || '—'}</p>
                                <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, margin: 0 }}>{u.email}{u.phone && ` · ${u.phone}`}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {u.roles?.map(r => (
                                    <span key={r} style={{ fontFamily: SANS, fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.55rem', borderRadius: '999px', backgroundColor: r === 'admin' ? 'rgba(192,57,43,0.1)' : r === 'vendedor' ? C.goldBg : 'rgba(27,48,34,0.07)', color: r === 'admin' ? C.red : r === 'vendedor' ? C.gold : C.forest }}>
                                        {r}
                                    </span>
                                ))}
                                <span style={{ fontFamily: SANS, fontSize: '0.65rem', color: '#ccc' }}>
                                    {new Date(u.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────────────────────────────────
interface GuestOrder {
    id: string; order_number: string; email: string; phone: string
    recipient_name: string; postal_code: string; colony: string; street: string
    subtotal: number; shipping: number; total: number; status: string; created_at: string
    items: { title: string; price: number; image_url?: string }[]
}
interface BookRow {
    id: string; title: string; author: string; price: number
    status: string; image_url?: string; seller_id?: string
}

// ─── OrderRow ─────────────────────────────────────────────────────────────────
function OrderRow({ order, compact, onChangeStatus }: {
    order: GuestOrder; compact?: boolean; onChangeStatus?: (id: string, status: string) => void
}) {
    const cfg = ORDER_LABELS[order.status] ?? ORDER_LABELS.pending
    return (
        <div style={{ backgroundColor: C.white, borderRadius: '12px', padding: '0.9rem 1rem', border: `1.5px solid ${C.border}`, display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.9rem', color: C.charcoal }}>#{order.order_number}</span>
                    <span style={{ fontFamily: SANS, fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.55rem', borderRadius: '999px', backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </div>
                <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, margin: '0 0 0.15rem' }}>
                    {order.recipient_name} · {order.phone}
                </p>
                {!compact && (
                    <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, margin: 0 }}>
                        {order.street}, {order.colony}, {order.postal_code}
                    </p>
                )}
                <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: '#bbb', margin: '0.2rem 0 0' }}>
                    {new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.95rem', color: C.forest }}>${order.total?.toFixed(0)}</span>
                {!compact && onChangeStatus && (
                    <select
                        value={order.status}
                        onChange={e => onChangeStatus(order.id, e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', border: `1.5px solid ${C.border}`, borderRadius: '7px', fontFamily: SANS, fontSize: '0.73rem', outline: 'none', cursor: 'pointer' }}
                    >
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_LABELS[s]?.label ?? s}</option>)}
                    </select>
                )}
            </div>
        </div>
    )
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function PageTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
    return (
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: C.forest, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', marginTop: 0 }}>
            {icon} {children}
        </h1>
    )
}
function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1rem', color: C.forest, marginBottom: '0.75rem', paddingBottom: '0.3rem', borderBottom: `2px solid rgba(27,48,34,0.1)` }}>{children}</h2>
}
function ActionBtn({ children, color, onClick, subtle }: { children: React.ReactNode; color: string; onClick?: () => void; subtle?: boolean }) {
    return (
        <button onClick={onClick} style={{
            fontFamily: SANS, fontWeight: 700, fontSize: '0.75rem',
            padding: '0.45rem 0.85rem', borderRadius: '8px', border: `1.5px solid ${color}`,
            backgroundColor: subtle ? 'transparent' : color,
            color: subtle ? color : C.cream,
            cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{children}</button>
    )
}
function StatusPill({ status }: { status: string }) {
    const lbl: Record<string, { label: string; color: string; bg: string }> = {
        available: { label: '✅ Publicado', color: C.forest, bg: 'rgba(27,48,34,0.08)' },
        sold: { label: '🎉 Vendido', color: C.gold, bg: C.goldBg },
        revision: { label: '⏳ En revisión', color: '#7A6000', bg: 'rgba(255,200,0,0.1)' },
        rejected: { label: '❌ Rechazado', color: C.red, bg: 'rgba(192,57,43,0.07)' },
    }
    const s = lbl[status] ?? lbl.revision
    return <span style={{ fontFamily: SANS, fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.55rem', borderRadius: '999px', backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}
function Toast({ msg }: { msg: string }) {
    return <div style={{ backgroundColor: C.forest, color: C.cream, fontFamily: SANS, fontSize: '0.82rem', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1rem' }}>{msg}</div>
}
function Empty({ text }: { text: string }) {
    return <p style={{ fontFamily: SANS, fontSize: '0.85rem', color: C.mid, textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: C.white, borderRadius: '12px', border: `1.5px solid ${C.border}` }}>{text}</p>
}
function Spinner() {
    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mid, fontFamily: SANS }}>
            <div style={{ width: '28px', height: '28px', border: `3px solid rgba(27,48,34,0.15)`, borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
const searchStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px',
    border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: '0.87rem',
    outline: 'none', backgroundColor: C.white, boxSizing: 'border-box',
}
