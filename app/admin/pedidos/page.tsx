'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7', creamDark: '#EDE9D8', forest: '#1B3022',
    charcoal: '#1A1A1A', mid: '#666', border: '#ddd9cc',
    white: '#fff', red: '#c0392b', blue: '#0050AA',
    purple: '#6B3FA0', gold: '#A67C00',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', serif"

// ─── Kanban columns ───────────────────────────────────────────────────────────
const COLUMNS: { key: string; label: string; dot: string; color: string; bg: string; border: string }[] = [
    { key: 'pending', label: 'Nuevos', dot: '🟡', color: '#7A6000', bg: '#FFFBEA', border: 'rgba(255,200,0,0.3)' },
    { key: 'confirmed', label: 'Preparando', dot: '🔵', color: C.blue, bg: '#F0F4FF', border: 'rgba(0,80,170,0.2)' },
    { key: 'shipped', label: 'En Ruta', dot: '🟣', color: C.purple, bg: '#F5F0FF', border: 'rgba(107,63,160,0.2)' },
    { key: 'delivered', label: 'Entregado', dot: '🟢', color: C.forest, bg: '#F0F7F1', border: 'rgba(27,48,34,0.2)' },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
    book_id?: string
    title: string
    author?: string
    price: number
    image_url?: string
    seller_id?: string
    ganancia1?: number
}

interface Order {
    id: string
    order_number: string
    recipient_name: string
    email: string
    phone: string
    postal_code: string
    colony: string
    street: string
    references?: string
    subtotal: number
    shipping: number
    total: number
    status: string
    created_at: string
    items: OrderItem[]
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminPedidosPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [selected, setSelected] = useState<Order | null>(null)
    const [dragId, setDragId] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState<string | null>(null)
    const [toast, setToast] = useState('')

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { router.push('/login'); return }
            const { data: p } = await supabase.from('profiles').select('roles').eq('id', user.id).single()
            if (!JSON.stringify(p?.roles || []).includes('admin')) { router.push('/'); return }
            setChecking(false)
            loadOrders()
        })
    }, [router])

    async function loadOrders() {
        const { data } = await supabase
            .from('guest_orders')
            .select('*')
            .order('created_at', { ascending: false })
        setOrders((data as Order[]) || [])
    }

    // ── Golden Rule: auto-credit sellers on delivery ──────────────────────────
    async function creditSellers(order: Order) {
        const items = order.items || []
        for (const item of items) {
            if (!item.book_id) continue
            // Mark book as sold — the seller's earnings are tracked via
            // the paid_out flow in Finanzas. Here we just flip the status.
            await supabase.from('books')
                .update({ status: 'sold' })
                .eq('id', item.book_id)
                .neq('status', 'sold') // idempotent
        }
    }

    async function moveOrder(orderId: string, targetStatus: string) {
        const prev = orders.find(o => o.id === orderId)
        if (!prev || prev.status === targetStatus) return

        // Optimistic update
        setOrders(os => os.map(o => o.id === orderId ? { ...o, status: targetStatus } : o))
        if (selected?.id === orderId) setSelected(s => s ? { ...s, status: targetStatus } : s)

        await supabase.from('guest_orders').update({ status: targetStatus }).eq('id', orderId)

        // Golden Rule trigger
        if (targetStatus === 'delivered') {
            await creditSellers(prev)
            showToast(`✅ #${prev.order_number} entregado — ganancias abonadas a vendedores`)
        }
    }

    function showToast(msg: string) {
        setToast(msg)
        setTimeout(() => setToast(''), 4000)
    }

    // ── Drag handlers ─────────────────────────────────────────────────────────
    function onDragStart(orderId: string) { setDragId(orderId) }
    function onDragEnd() { setDragId(null); setDragOver(null) }
    function onDragOverCol(status: string, e: React.DragEvent) { e.preventDefault(); setDragOver(status) }
    function onDropCol(status: string, e: React.DragEvent) {
        e.preventDefault()
        if (dragId) moveOrder(dragId, status)
        setDragId(null); setDragOver(null)
    }

    if (checking) return <Loading />

    const byStatus = (status: string) => orders.filter(o => o.status === status)

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.creamDark, display: 'flex', flexDirection: 'column' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes toastIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .card-drag { cursor: grab; transition: box-shadow 0.15s, transform 0.15s; }
                .card-drag:active { cursor: grabbing; }
                .card-drag:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.12); transform: translateY(-1px); }
            `}</style>

            {/* ── Top bar ── */}
            <div style={{ backgroundColor: C.forest, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                <button onClick={() => router.push('/admin')}
                    style={{ background: 'none', border: 'none', color: 'rgba(245,242,231,0.6)', cursor: 'pointer', fontFamily: SANS, fontSize: '0.82rem' }}>
                    ← Admin
                </button>
                <h1 style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: C.cream, margin: 0, flex: 1 }}>
                    📦 Gestión de Pedidos
                </h1>
                <span style={{ fontFamily: SANS, fontSize: '0.72rem', color: 'rgba(245,242,231,0.5)' }}>
                    {orders.length} pedidos totales
                </span>
            </div>

            {/* ── Kanban board ── */}
            <div style={{ flex: 1, display: 'flex', gap: '0.85rem', padding: '1rem', overflowX: 'auto', alignItems: 'flex-start' }}>
                {COLUMNS.map(col => (
                    <KanbanColumn
                        key={col.key}
                        col={col}
                        orders={byStatus(col.key)}
                        isDragOver={dragOver === col.key}
                        onDragOver={e => onDragOverCol(col.key, e)}
                        onDrop={e => onDropCol(col.key, e)}
                        onCardClick={setSelected}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        dragId={dragId}
                    />
                ))}
            </div>

            {/* ── Detail panel ── */}
            {selected && (
                <DetailPanel
                    order={selected}
                    onClose={() => setSelected(null)}
                    onMove={(status) => moveOrder(selected.id, status)}
                />
            )}

            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: C.forest, color: C.cream,
                    fontFamily: SANS, fontWeight: 600, fontSize: '0.85rem',
                    padding: '0.75rem 1.5rem', borderRadius: '999px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    animation: 'toastIn 0.3s ease', zIndex: 100, whiteSpace: 'nowrap',
                }}>
                    {toast}
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// KANBAN COLUMN
// ══════════════════════════════════════════════════════════════════════════════
function KanbanColumn({ col, orders, isDragOver, onDragOver, onDrop, onCardClick, onDragStart, onDragEnd, dragId }: {
    col: typeof COLUMNS[0]
    orders: Order[]
    isDragOver: boolean
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    onCardClick: (o: Order) => void
    onDragStart: (id: string) => void
    onDragEnd: () => void
    dragId: string | null
}) {
    return (
        <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{
                flex: '0 0 240px', minWidth: '240px',
                maxHeight: 'calc(100vh - 130px)',
                overflowY: 'auto',
                backgroundColor: isDragOver ? col.bg : 'rgba(255,255,255,0.55)',
                borderRadius: '14px',
                border: isDragOver ? `2px dashed ${col.color}` : `1.5px solid ${col.border}`,
                padding: '0.75rem',
                transition: 'background-color 0.15s, border-color 0.15s',
            }}
        >
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', padding: '0 0.15rem' }}>
                <span>{col.dot}</span>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem', color: col.color, flex: 1 }}>{col.label}</span>
                <span style={{
                    fontFamily: SANS, fontWeight: 700, fontSize: '0.7rem',
                    backgroundColor: col.bg, color: col.color,
                    padding: '0.1rem 0.5rem', borderRadius: '999px',
                    border: `1px solid ${col.border}`,
                }}>
                    {orders.length}
                </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '60px' }}>
                {orders.length === 0 && (
                    <div style={{ fontFamily: SANS, fontSize: '0.72rem', color: '#ccc', textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                        Sin pedidos
                    </div>
                )}
                {orders.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        col={col}
                        isDragging={dragId === order.id}
                        onClick={() => onCardClick(order)}
                        onDragStart={() => onDragStart(order.id)}
                        onDragEnd={onDragEnd}
                    />
                ))}
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// ORDER CARD
// ══════════════════════════════════════════════════════════════════════════════
function OrderCard({ order, col, isDragging, onClick, onDragStart, onDragEnd }: {
    order: Order; col: typeof COLUMNS[0]; isDragging: boolean
    onClick: () => void; onDragStart: () => void; onDragEnd: () => void
}) {
    const elapsed = timeSince(order.created_at)

    return (
        <div
            className="card-drag"
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            style={{
                backgroundColor: C.white,
                borderRadius: '11px',
                padding: '0.8rem',
                border: `1.5px solid ${C.border}`,
                opacity: isDragging ? 0.45 : 1,
                transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
                userSelect: 'none',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem', color: C.charcoal }}>#{order.order_number}</span>
                <span style={{ fontFamily: SANS, fontSize: '0.62rem', color: '#bbb', flexShrink: 0, marginLeft: '0.3rem' }}>{elapsed}</span>
            </div>

            <p style={{ fontFamily: SANS, fontSize: '0.75rem', color: '#444', margin: '0 0 0.45rem', lineHeight: 1.3 }}>
                {order.recipient_name}
            </p>

            {/* Mini book list */}
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                {(order.items || []).slice(0, 3).map((item, i) => (
                    <div key={i} style={{ width: '28px', height: '36px', borderRadius: '4px', overflow: 'hidden', backgroundColor: C.creamDark, flexShrink: 0 }}>
                        {item.image_url
                            ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>📚</div>
                        }
                    </div>
                ))}
                {order.items?.length > 3 && (
                    <div style={{ width: '28px', height: '36px', borderRadius: '4px', backgroundColor: C.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: '0.65rem', color: C.mid }}>
                        +{order.items.length - 3}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid }}>
                    {order.items?.length || 0} libro{order.items?.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.85rem', color: col.color }}>
                    ${order.total?.toFixed(0)}
                </span>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// DETAIL PANEL (slide-out)
// ══════════════════════════════════════════════════════════════════════════════
function DetailPanel({ order, onClose, onMove }: {
    order: Order; onClose: () => void; onMove: (status: string) => void
}) {
    const currentColIdx = COLUMNS.findIndex(c => c.key === order.status)
    const col = COLUMNS[currentColIdx] ?? COLUMNS[0]
    const nextCol = COLUMNS[currentColIdx + 1]

    const waText = encodeURIComponent(
        `¡Hola ${order.recipient_name}! 👋\n\nRecibimos tu pedido *#${order.order_number}* en Libroloop por un total de *$${order.total?.toFixed(0)}* (incluye envío).\n\nTe escribimos para confirmar tu dirección y coordinar tu pago.\n¿Prefieres transferencia o pago a contraentrega?`
    )
    const waPhone = order.phone?.replace(/\D/g, '') || ''

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40, backdropFilter: 'blur(2px)' }} />

            {/* Panel */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(440px, 100vw)',
                backgroundColor: C.cream,
                zIndex: 50, overflowY: 'auto',
                animation: 'slideIn 0.25s ease',
                boxShadow: '-6px 0 32px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* ── Panel header ── */}
                <div style={{ backgroundColor: C.forest, padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.cream, cursor: 'pointer', fontFamily: SANS, fontSize: '1.1rem', lineHeight: 1, padding: '0.1rem 0.3rem' }}>✕</button>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.9rem', color: C.cream, margin: 0 }}>#{order.order_number}</p>
                        <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: 'rgba(245,242,231,0.6)', margin: 0 }}>
                            {new Date(order.created_at).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <span style={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.7rem', borderRadius: '999px', backgroundColor: col.bg, color: col.color }}>
                        {col.dot} {col.label}
                    </span>
                </div>

                <div style={{ padding: '1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* ── A: Contacto ── */}
                    <Section title="📞 Contacto">
                        <p style={INFO}>{order.recipient_name}</p>
                        <p style={INFO}>{order.phone} · {order.email}</p>
                        {waPhone && (
                            <a href={`https://wa.me/52${waPhone}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#25D366', color: C.white, fontFamily: SANS, fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', padding: '0.55rem 1rem', borderRadius: '10px', marginTop: '0.4rem' }}>
                                💬 Abrir chat en WhatsApp
                            </a>
                        )}
                    </Section>

                    {/* ── B: Logística ── */}
                    <Section title="📍 Dirección de Entrega">
                        <p style={INFO}>{order.street}</p>
                        <p style={INFO}>Col. {order.colony}, C.P. {order.postal_code}</p>
                        {(order as any).references && (
                            <p style={{ ...INFO, color: C.mid, fontStyle: 'italic' }}>Ref: {(order as any).references}</p>
                        )}
                    </Section>

                    {/* ── C: Picking list ── */}
                    <Section title="📦 Lista de Empaque">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {(order.items || []).map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', backgroundColor: C.white, borderRadius: '10px', padding: '0.6rem 0.75rem', border: `1.5px solid ${C.border}` }}>
                                    <div style={{ width: '38px', height: '50px', borderRadius: '5px', overflow: 'hidden', backgroundColor: C.creamDark, flexShrink: 0 }}>
                                        {item.image_url
                                            ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📚</div>
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.8rem', color: C.charcoal, margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                                        {item.author && <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, margin: 0 }}>{item.author}</p>}
                                    </div>
                                    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.85rem', color: C.forest, flexShrink: 0 }}>${item.price?.toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* ── D: Desglose financiero ── */}
                    <Section title="💵 Desglose Financiero">
                        <div style={{ backgroundColor: C.white, borderRadius: '10px', padding: '0.85rem', border: `1.5px solid ${C.border}` }}>
                            <FinRow label="Subtotal Libros" value={`$${order.subtotal?.toFixed(0)}`} />
                            <FinRow label={order.shipping === 0 ? 'Envío 🎉 GRATIS' : 'Envío'} value={order.shipping === 0 ? '$0' : `$${order.shipping?.toFixed(0)}`} />
                            <div style={{ borderTop: `1.5px solid ${C.border}`, marginTop: '0.5rem', paddingTop: '0.5rem' }} />
                            <FinRow label="Total a cobrar" value={`$${order.total?.toFixed(0)}`} bold />
                        </div>
                    </Section>
                </div>

                {/* ── Move action ── */}
                <div style={{ padding: '0.85rem 1.1rem', borderTop: `1px solid ${C.border}`, backgroundColor: C.creamDark, flexShrink: 0, display: 'flex', gap: '0.5rem' }}>
                    {nextCol && (
                        <button onClick={() => onMove(nextCol.key)} style={{
                            flex: 1, backgroundColor: nextCol.color === C.forest ? C.forest : nextCol.bg,
                            color: nextCol.color === C.forest ? C.cream : nextCol.color,
                            fontFamily: SANS, fontWeight: 700, fontSize: '0.85rem',
                            border: `2px solid ${nextCol.color}`,
                            borderRadius: '10px', padding: '0.7rem', cursor: 'pointer',
                        }}>
                            → Mover a {nextCol.dot} {nextCol.label}
                        </button>
                    )}
                    {order.status === 'delivered' && (
                        <div style={{ flex: 1, textAlign: 'center', fontFamily: SANS, fontSize: '0.78rem', color: C.forest, padding: '0.7rem', backgroundColor: 'rgba(27,48,34,0.06)', borderRadius: '10px' }}>
                            ✅ Entregado — ganancias abonadas
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.72rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>{title}</p>
            {children}
        </div>
    )
}
function FinRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
            <span style={{ fontFamily: SANS, fontSize: '0.8rem', color: bold ? C.charcoal : C.mid, fontWeight: bold ? 700 : 400 }}>{label}</span>
            <span style={{ fontFamily: SANS, fontSize: bold ? '1rem' : '0.82rem', fontWeight: 700, color: bold ? C.forest : C.charcoal }}>{value}</span>
        </div>
    )
}
function Loading() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(27,48,34,0.15)', borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
function timeSince(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
}

const INFO: React.CSSProperties = { fontFamily: SANS, fontSize: '0.82rem', color: '#333', margin: '0 0 0.2rem', lineHeight: 1.5 }
