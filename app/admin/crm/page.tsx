'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7', creamDark: '#EDE9D8', forest: '#1B3022',
    charcoal: '#1A1A1A', mid: '#777', border: '#ddd9cc',
    gold: '#A67C00', goldBg: 'rgba(166,124,0,0.09)',
    white: '#fff', red: '#c0392b', redBg: 'rgba(192,57,43,0.07)',
    blue: '#0050AA', blueBg: 'rgba(0,80,170,0.07)',
    purple: '#6B3FA0', purpleBg: 'rgba(107,63,160,0.08)',
    teal: '#0E7490', tealBg: 'rgba(14,116,144,0.08)',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', serif"

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
    id: string
    name?: string
    email: string
    phone?: string
    roles: string[]
    created_at: string
    bank_name?: string
    clabe?: string
    bank_alias?: string
    notes?: string
    suspended?: boolean
    // computed
    totalPurchased: number
    totalSold: number
    purchaseCount: number
    saleCount: number
}

interface Order {
    id: string; order_number: string; total: number; status: string; created_at: string
    items: { title: string; price: number }[]
}
interface Book {
    id: string; title: string; price: number; status: string; seller_earning?: number; paid_out?: boolean; created_at: string
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminCRMPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [users, setUsers] = useState<UserRow[]>([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [selected, setSelected] = useState<UserRow | null>(null)
    const [toast, setToast] = useState('')

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { router.push('/login'); return }
            const { data: p } = await supabase.from('profiles').select('roles').eq('id', user.id).single()
            if (!JSON.stringify(p?.roles || []).includes('admin')) { router.push('/'); return }
            setChecking(false)
            loadUsers()
        })
    }, [router])

    async function loadUsers() {
        const [profilesRes, ordersRes, booksRes] = await Promise.all([
            supabase.from('profiles').select('id,name,email,phone,roles,created_at,bank_name,clabe,bank_alias,notes,suspended').order('created_at', { ascending: false }),
            supabase.from('guest_orders').select('email,total,status'),
            supabase.from('books').select('seller_id,price,status,seller_earning'),
        ])

        const profiles = profilesRes.data || []
        const orders = ordersRes.data || []
        const books = booksRes.data || []

        const enriched: UserRow[] = profiles.map((p: any) => {
            const myOrders = orders.filter((o: any) => o.email === p.email)
            const totalPurchased = myOrders.filter((o: any) => o.status === 'delivered')
                .reduce((s: number, o: any) => s + (o.total || 0), 0)

            const myBooks = books.filter((b: any) => b.seller_id === p.id)
            const soldBooks = myBooks.filter((b: any) => b.status === 'sold')
            const totalSold = soldBooks.reduce((s: number, b: any) => s + (b.seller_earning || b.price || 0), 0)

            return {
                ...p,
                roles: p.roles || [],
                totalPurchased,
                totalSold,
                purchaseCount: myOrders.length,
                saleCount: myBooks.filter((b: any) => b.status === 'available' || b.status === 'sold').length,
            }
        })

        setUsers(enriched)
        setLoading(false)
    }

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

    // ── Filter ────────────────────────────────────────────────────────────────
    const q = query.toLowerCase()
    const filtered = useMemo(() => users.filter(u => {
        if (q && !(
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.phone?.includes(q)
        )) return false
        if (roleFilter === 'comprador' && !u.roles?.includes('comprador') && u.totalPurchased === 0) return false
        if (roleFilter === 'vendedor' && !u.roles?.includes('vendedor')) return false
        if (roleFilter === 'loop' && !(u.totalPurchased > 0 && (u.roles?.includes('vendedor') || u.totalSold > 0))) return false
        return true
    }), [users, q, roleFilter])

    // ── CSV export ────────────────────────────────────────────────────────────
    function exportCSV() {
        const header = ['Nombre', 'Email', 'Teléfono', 'Roles', 'Total Comprado', 'Total Vendido', 'Fecha Registro']
        const rows = filtered.map(u => [
            u.name || '',
            u.email,
            u.phone || '',
            (u.roles || []).join(';'),
            u.totalPurchased.toFixed(2),
            u.totalSold.toFixed(2),
            new Date(u.created_at).toLocaleDateString('es-MX'),
        ])
        const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `libroloop_clientes_${new Date().toISOString().slice(0, 10)}.csv`
        a.click(); URL.revokeObjectURL(url)
        showToast('📥 CSV exportado')
    }

    async function resetPassword(user: UserRow) {
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` })
        showToast(error ? `❌ Error: ${error.message}` : `📧 Correo de recuperación enviado a ${user.email}`)
    }

    async function toggleSuspend(user: UserRow) {
        const newVal = !user.suspended
        await supabase.from('profiles').update({ suspended: newVal }).eq('id', user.id)
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, suspended: newVal } : u))
        if (selected?.id === user.id) setSelected(s => s ? { ...s, suspended: newVal } : s)
        showToast(newVal ? `⛔ ${user.name || user.email} suspendido` : `✅ ${user.name || user.email} reactivado`)
    }

    async function saveNotes(userId: string, notes: string) {
        await supabase.from('profiles').update({ notes }).eq('id', userId)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, notes } : u))
        if (selected?.id === userId) setSelected(s => s ? { ...s, notes } : s)
        showToast('📝 Nota guardada')
    }

    if (checking) return <Spin />

    // ── Summary stats ─────────────────────────────────────────────────────────
    const loops = users.filter(u => u.totalPurchased > 0 && u.totalSold > 0).length
    const sellers = users.filter(u => u.roles?.includes('vendedor')).length
    const buyers = users.filter(u => u.totalPurchased > 0).length
    const topLTV = Math.max(...users.map(u => u.totalPurchased + u.totalSold), 0)

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.cream }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideModal { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: none; } }
                .row-btn:hover { background-color: rgba(27,48,34,0.05) !important; }
            `}</style>

            {/* ── Top bar ── */}
            <div style={{ backgroundColor: C.forest, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 30 }}>
                <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: 'rgba(245,242,231,0.6)', cursor: 'pointer', fontFamily: SANS, fontSize: '0.82rem' }}>
                    ← Admin
                </button>
                <h1 style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: C.cream, margin: 0, flex: 1 }}>
                    🧑‍💼 CRM — Gestión de Clientes
                </h1>
                <button onClick={exportCSV} style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.75rem', padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', backgroundColor: C.gold, color: C.white, cursor: 'pointer' }}>
                    📥 Exportar CSV
                </button>
            </div>

            <div style={{ padding: '1rem 1.25rem', maxWidth: '1100px', margin: '0 auto' }}>

                {/* ── Mini KPIs ── */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {[
                        { label: 'Total usuarios', val: users.length, color: C.forest },
                        { label: 'Compradores', val: buyers, color: C.blue },
                        { label: 'Vendedores', val: sellers, color: C.gold },
                        { label: '🔁 Usuarios Loop', val: loops, color: C.purple },
                        { label: 'LTV máximo', val: `$${topLTV.toFixed(0)}`, color: C.teal },
                    ].map((k, i) => (
                        <div key={i} style={{ backgroundColor: C.white, borderRadius: '10px', padding: '0.6rem 0.9rem', border: `1.5px solid ${C.border}`, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.05rem', color: k.color }}>{k.val}</span>
                            <span style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid }}>{k.label}</span>
                        </div>
                    ))}
                </div>

                {/* ── Search & filters ── */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.85rem', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 220px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Nombre, correo o teléfono…"
                            style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.1rem', borderRadius: '10px', border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: '0.85rem', outline: 'none', backgroundColor: C.white, boxSizing: 'border-box' }} />
                    </div>
                    {[
                        { key: 'all', label: '👥 Todos' },
                        { key: 'comprador', label: '🛒 Compradores' },
                        { key: 'vendedor', label: '📚 Vendedores' },
                        { key: 'loop', label: '🔁 Usuarios Loop' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setRoleFilter(f.key)} style={{
                            fontFamily: SANS, fontWeight: 600, fontSize: '0.73rem',
                            padding: '0.4rem 0.85rem', borderRadius: '999px', cursor: 'pointer',
                            border: `1.5px solid ${roleFilter === f.key ? C.forest : C.border}`,
                            backgroundColor: roleFilter === f.key ? C.forest : C.white,
                            color: roleFilter === f.key ? C.cream : C.mid, transition: 'all 0.15s',
                        }}>{f.label}</button>
                    ))}
                    <span style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, marginLeft: '0.25rem' }}>
                        {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* ── Data table ── */}
                {loading ? <Spin /> : (
                    <div style={{ backgroundColor: C.white, borderRadius: '14px', border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>

                        {/* Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 90px 90px', backgroundColor: C.creamDark, borderBottom: `1.5px solid ${C.border}` }}>
                            {['Usuario', 'Tipo', 'Total Comprado', 'Total Vendido', 'Miembro desde'].map((h, i) => (
                                <div key={i} style={{ padding: '0.6rem 0.85rem', fontFamily: SANS, fontWeight: 700, fontSize: '0.65rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</div>
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', fontFamily: SANS, fontSize: '0.85rem', color: C.mid }}>
                                No se encontraron usuarios.
                            </div>
                        )}

                        {filtered.map((u, idx) => {
                            const badge = userBadge(u)
                            const ltv = u.totalPurchased + u.totalSold
                            const isVIP = ltv > 500
                            return (
                                <div key={u.id} className="row-btn"
                                    onClick={() => setSelected(u)}
                                    style={{
                                        display: 'grid', gridTemplateColumns: '1fr 100px 90px 90px 90px',
                                        borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                                        alignItems: 'center', cursor: 'pointer',
                                        opacity: u.suspended ? 0.45 : 1,
                                        transition: 'background-color 0.12s',
                                    }}>
                                    {/* Name + contact */}
                                    <div style={{ padding: '0.7rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        {/* Avatar */}
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                                            {badge.icon}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem', color: C.charcoal, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {u.name || '—'}
                                                </p>
                                                {isVIP && <span style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem', borderRadius: '999px', backgroundColor: C.goldBg, color: C.gold, fontFamily: SANS, fontWeight: 700, flexShrink: 0 }}>VIP</span>}
                                                {u.suspended && <span style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem', borderRadius: '999px', backgroundColor: C.redBg, color: C.red, fontFamily: SANS, fontWeight: 700, flexShrink: 0 }}>⛔</span>}
                                            </div>
                                            <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {u.email}{u.phone && ` · ${u.phone}`}
                                            </p>
                                        </div>
                                        {/* WhatsApp shortcut */}
                                        {u.phone && (
                                            <a href={`https://wa.me/52${u.phone.replace(/\D/g, '')}`}
                                                target="_blank" rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                style={{ flexShrink: 0, fontSize: '1rem', textDecoration: 'none', opacity: 0.7 }}
                                                title="Abrir WhatsApp">
                                                💬
                                            </a>
                                        )}
                                    </div>

                                    {/* Badge */}
                                    <div style={{ padding: '0 0.85rem' }}>
                                        <span style={{ fontFamily: SANS, fontSize: '0.64rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', backgroundColor: badge.bg, color: badge.color }}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    {/* Total comprado */}
                                    <div style={{ padding: '0 0.85rem', textAlign: 'right' }}>
                                        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem', color: u.totalPurchased > 0 ? C.blue : '#ddd' }}>
                                            ${u.totalPurchased.toFixed(0)}
                                        </span>
                                        {u.purchaseCount > 0 && <div style={{ fontFamily: SANS, fontSize: '0.6rem', color: C.mid }}>{u.purchaseCount} pedido{u.purchaseCount !== 1 ? 's' : ''}</div>}
                                    </div>

                                    {/* Total vendido */}
                                    <div style={{ padding: '0 0.85rem', textAlign: 'right' }}>
                                        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem', color: u.totalSold > 0 ? C.gold : '#ddd' }}>
                                            ${u.totalSold.toFixed(0)}
                                        </span>
                                        {u.saleCount > 0 && <div style={{ fontFamily: SANS, fontSize: '0.6rem', color: C.mid }}>{u.saleCount} libro{u.saleCount !== 1 ? 's' : ''}</div>}
                                    </div>

                                    {/* Date */}
                                    <div style={{ padding: '0 0.85rem', textAlign: 'right', fontFamily: SANS, fontSize: '0.7rem', color: C.mid }}>
                                        {new Date(u.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Profile panel ── */}
            {selected && (
                <ProfilePanel
                    user={selected}
                    onClose={() => setSelected(null)}
                    onResetPassword={() => resetPassword(selected)}
                    onToggleSuspend={() => toggleSuspend(selected)}
                    onSaveNotes={(notes) => saveNotes(selected.id, notes)}
                    onExportUser={() => {
                        const row = [selected.name || '', selected.email, selected.phone || '', selected.created_at]
                        const csv = `"${row.join('","')}"`
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href = url; a.download = `${selected.email}.csv`; a.click()
                        URL.revokeObjectURL(url)
                    }}
                />
            )}

            {/* ── Toast ── */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: C.forest, color: C.cream, fontFamily: SANS, fontWeight: 600, fontSize: '0.85rem', padding: '0.7rem 1.5rem', borderRadius: '999px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 300, whiteSpace: 'nowrap', animation: 'fadeUp 0.3s ease' }}>
                    {toast}
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE PANEL (slide-out)
// ══════════════════════════════════════════════════════════════════════════════
function ProfilePanel({ user, onClose, onResetPassword, onToggleSuspend, onSaveNotes, onExportUser }: {
    user: UserRow
    onClose: () => void
    onResetPassword: () => void
    onToggleSuspend: () => void
    onSaveNotes: (notes: string) => void
    onExportUser: () => void
}) {
    const [histTab, setHistTab] = useState<'compras' | 'ventas'>('compras')
    const [showCLABE, setShowCLABE] = useState(false)
    const [notes, setNotes] = useState(user.notes || '')
    const [orders, setOrders] = useState<Order[]>([])
    const [books, setBooks] = useState<Book[]>([])
    const [loadingHist, setLoadingHist] = useState(true)
    const [resetConfirm, setResetConfirm] = useState(false)
    const [suspendConfirm, setSuspendConfirm] = useState(false)

    const badge = userBadge(user)

    useEffect(() => {
        setNotes(user.notes || '')
        setShowCLABE(false)
        setLoadingHist(true)
        Promise.all([
            supabase.from('guest_orders').select('id,order_number,total,status,created_at,items').eq('email', user.email).order('created_at', { ascending: false }),
            supabase.from('books').select('id,title,price,status,seller_earning,paid_out,created_at').eq('seller_id', user.id).order('created_at', { ascending: false }),
        ]).then(([ord, bks]) => {
            setOrders(ord.data || [])
            setBooks(bks.data || [])
            setLoadingHist(false)
        })
    }, [user.id, user.email])

    const pendingBalance = books.filter(b => b.status === 'sold' && !b.paid_out).reduce((s, b) => s + (b.seller_earning || b.price || 0), 0)

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(520px, 100vw)', backgroundColor: C.cream, zIndex: 50, overflowY: 'auto', animation: 'slideIn 0.25s ease', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>

                {/* ── Panel header ── */}
                <div style={{ backgroundColor: C.forest, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                        {badge.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.95rem', color: C.cream, margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</p>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: SANS, fontSize: '0.63rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                            {user.suspended && <span style={{ fontFamily: SANS, fontSize: '0.63rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', backgroundColor: 'rgba(192,57,43,0.2)', color: C.red }}>⛔ Suspendido</span>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,242,231,0.5)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>✕</button>
                </div>

                <div style={{ flex: 1, padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

                    {/* ── Identity card ── */}
                    <Card>
                        <SectionLabel>📋 Datos de Contacto</SectionLabel>
                        <InfoRow icon="✉️" label="Email">
                            <a href={`mailto:${user.email}`} style={{ color: C.blue, textDecoration: 'none', fontFamily: SANS, fontSize: '0.82rem' }}>{user.email}</a>
                        </InfoRow>
                        {user.phone && (
                            <InfoRow icon="📱" label="Teléfono">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontFamily: SANS, fontSize: '0.82rem', color: C.charcoal }}>{user.phone}</span>
                                    <a href={`https://wa.me/52${user.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '0.85rem', textDecoration: 'none' }}>💬</a>
                                </div>
                            </InfoRow>
                        )}

                        {/* Banking (hidden by default) */}
                        {(user.bank_name || user.clabe) && (
                            <>
                                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                    <button onClick={() => setShowCLABE(v => !v)} style={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 600, color: C.mid, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        🏦 Datos bancarios {showCLABE ? '▲ Ocultar' : '▼ Mostrar'}
                                    </button>
                                </div>
                                {showCLABE && (
                                    <div style={{ backgroundColor: C.creamDark, borderRadius: '9px', padding: '0.65rem', marginTop: '0.4rem', fontFamily: SANS, fontSize: '0.78rem', color: C.charcoal }}>
                                        {user.bank_name && <p style={{ margin: '0 0 0.25rem' }}>Banco: <strong>{user.bank_name}</strong></p>}
                                        {user.clabe && <p style={{ margin: 0, fontFamily: "'Courier New',monospace", letterSpacing: '0.05em', color: C.blue }}>{user.clabe}</p>}
                                    </div>
                                )}
                            </>
                        )}
                    </Card>

                    {/* ── LTV quick stats ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <MiniStat label="Total Comprado" value={`$${user.totalPurchased.toFixed(0)}`} color={C.blue} />
                        <MiniStat label="Total Vendido" value={`$${user.totalSold.toFixed(0)}`} color={C.gold} />
                        <MiniStat label="LTV Total" value={`$${(user.totalPurchased + user.totalSold).toFixed(0)}`} color={C.teal} />
                        {pendingBalance > 0 && <MiniStat label="Saldo Pendiente" value={`$${pendingBalance.toFixed(0)}`} color={C.red} />}
                    </div>

                    {/* ── Notes ── */}
                    <Card>
                        <SectionLabel>📝 Notas Internas</SectionLabel>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Ej: Prefiere entregas por las tardes. Le gusta la novela histórica."
                            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: '0.8rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', backgroundColor: C.creamDark }}
                        />
                        <button onClick={() => onSaveNotes(notes)} style={{ marginTop: '0.4rem', fontFamily: SANS, fontWeight: 700, fontSize: '0.73rem', padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', backgroundColor: C.forest, color: C.cream, cursor: 'pointer' }}>
                            Guardar nota
                        </button>
                    </Card>

                    {/* ── Dual history tabs ── */}
                    <Card>
                        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.85rem', borderBottom: `1.5px solid ${C.border}`, paddingBottom: '0.5rem' }}>
                            {(['compras', 'ventas'] as const).map(t => (
                                <button key={t} onClick={() => setHistTab(t)} style={{
                                    fontFamily: SANS, fontWeight: 600, fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '7px',
                                    border: 'none', cursor: 'pointer',
                                    backgroundColor: histTab === t ? C.forest : 'transparent',
                                    color: histTab === t ? C.cream : C.mid, transition: 'all 0.15s',
                                }}>
                                    {t === 'compras' ? '🛒 Sus Compras' : '📚 Sus Ventas'}
                                </button>
                            ))}
                        </div>

                        {loadingHist ? <Spin /> : histTab === 'compras' ? (
                            orders.length === 0
                                ? <EmptyHint>Sin pedidos registrados.</EmptyHint>
                                : orders.map(o => (
                                    <div key={o.id} style={{ padding: '0.55rem 0', borderBottom: `1px solid ${C.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.8rem', color: C.charcoal, margin: '0 0 0.1rem' }}>#{o.order_number}</p>
                                                <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, margin: 0 }}>
                                                    {new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })} · {(o.items?.length || 0)} libro{(o.items?.length || 0) !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.85rem', color: C.forest }}>${o.total?.toFixed(0)}</span>
                                                <div style={{ fontFamily: SANS, fontSize: '0.62rem', color: C.mid }}>{statusLabel(o.status)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            books.length === 0
                                ? <EmptyHint>Sin libros registrados.</EmptyHint>
                                : books.map(b => (
                                    <div key={b.id} style={{ padding: '0.55rem 0', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontFamily: SERIF, fontSize: '0.8rem', fontWeight: 700, color: C.charcoal, margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</p>
                                            <p style={{ fontFamily: SANS, fontSize: '0.65rem', color: C.mid, margin: 0 }}>
                                                {new Date(b.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <StatusBook status={b.status} />
                                            {b.status === 'sold' && (
                                                <div style={{ fontFamily: SANS, fontSize: '0.65rem', color: b.paid_out ? C.mid : C.gold, marginTop: '0.1rem' }}>
                                                    {b.paid_out ? '✓ Liquidado' : `💰 $${(b.seller_earning || b.price || 0).toFixed(0)} pendiente`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                        )}
                    </Card>

                    {/* ── Admin actions ── */}
                    <Card>
                        <SectionLabel>⚙️ Acciones de Admin</SectionLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <ActionBtn onClick={onResetPassword} icon="🔑" label="Restablecer Contraseña" />
                            <ActionBtn onClick={onExportUser} icon="📄" label="Exportar Datos" />
                            {!resetConfirm && !suspendConfirm && (
                                <button onClick={() => setSuspendConfirm(true)} style={{ ...btnBase, backgroundColor: user.suspended ? C.forest : C.redBg, color: user.suspended ? C.cream : C.red, border: `1.5px solid ${user.suspended ? C.forest : C.red}` }}>
                                    {user.suspended ? '✅ Reactivar Cuenta' : '⛔ Suspender Cuenta'}
                                </button>
                            )}
                            {suspendConfirm && (
                                <div style={{ width: '100%', backgroundColor: C.redBg, borderRadius: '9px', padding: '0.65rem 0.85rem', fontFamily: SANS, fontSize: '0.78rem', color: C.red }}>
                                    ¿Confirmas {user.suspended ? 'reactivar' : 'suspender'} a <strong>{user.name || user.email}</strong>?
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                                        <button onClick={() => { onToggleSuspend(); setSuspendConfirm(false) }} style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.73rem', padding: '0.35rem 0.75rem', borderRadius: '7px', border: 'none', backgroundColor: C.red, color: C.white, cursor: 'pointer' }}>
                                            Sí, confirmar
                                        </button>
                                        <button onClick={() => setSuspendConfirm(false)} style={{ fontFamily: SANS, fontWeight: 600, fontSize: '0.73rem', padding: '0.35rem 0.75rem', borderRadius: '7px', border: `1.5px solid ${C.border}`, backgroundColor: 'transparent', color: C.mid, cursor: 'pointer' }}>
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function userBadge(u: UserRow) {
    const isSeller = u.roles?.includes('vendedor') || u.totalSold > 0
    const isBuyer = u.totalPurchased > 0
    if (isSeller && isBuyer) return { label: '🔁 Usuario Loop', icon: '🔁', color: C.purple, bg: '#EDE9FA' }
    if (isSeller) return { label: '📚 Vendedor', icon: '📚', color: C.gold, bg: C.goldBg }
    if (isBuyer) return { label: '🛒 Comprador', icon: '🛒', color: C.blue, bg: C.blueBg }
    return { label: '👤 Registrado', icon: '👤', color: C.mid, bg: '#f0f0f0' }
}
function statusLabel(s: string) {
    const m: Record<string, string> = { pending: '🟡 Pendiente', confirmed: '🔵 Preparando', shipped: '🟣 En Ruta', delivered: '🟢 Entregado', cancelled: '🔴 Cancelado' }
    return m[s] ?? s
}
function Card({ children }: { children: React.ReactNode }) {
    return <div style={{ backgroundColor: C.white, borderRadius: '12px', border: `1.5px solid ${C.border}`, padding: '0.9rem 1rem' }}>{children}</div>
}
function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.67rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.65rem' }}>{children}</p>
}
function InfoRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid #f0ede4' }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{icon}</span>
            <span style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, flexShrink: 0, width: '52px' }}>{label}</span>
            <div style={{ flex: 1 }}>{children}</div>
        </div>
    )
}
function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ backgroundColor: C.white, borderRadius: '10px', border: `1.5px solid ${C.border}`, padding: '0.6rem 0.75rem' }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.05rem', color }}>{value}</div>
            <div style={{ fontFamily: SANS, fontSize: '0.65rem', color: C.mid, marginTop: '0.1rem' }}>{label}</div>
        </div>
    )
}
function StatusBook({ status }: { status: string }) {
    const m: Record<string, { l: string; c: string; bg: string }> = {
        available: { l: '✅ Publicado', c: C.forest, bg: 'rgba(27,48,34,0.08)' },
        sold: { l: '🎉 Vendido', c: C.gold, bg: C.goldBg },
        revision: { l: '⏳ En revisión', c: '#7A6000', bg: 'rgba(255,200,0,0.1)' },
        rejected: { l: '❌ Rechazado', c: C.red, bg: C.redBg },
    }
    const s = m[status] ?? m.revision
    return <span style={{ fontFamily: SANS, fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', backgroundColor: s.bg, color: s.c }}>{s.l}</span>
}
function ActionBtn({ onClick, icon, label }: { onClick: () => void; icon: string; label: string }) {
    return (
        <button onClick={onClick} style={btnBase}>
            {icon} {label}
        </button>
    )
}
function EmptyHint({ children }: { children: React.ReactNode }) {
    return <p style={{ fontFamily: SANS, fontSize: '0.8rem', color: C.mid, textAlign: 'center', padding: '1.5rem 0' }}>{children}</p>
}
function Spin() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
            <div style={{ width: '22px', height: '22px', border: '3px solid rgba(27,48,34,0.15)', borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
    )
}
const btnBase: React.CSSProperties = {
    fontFamily: SANS, fontWeight: 600, fontSize: '0.73rem', padding: '0.42rem 0.85rem', borderRadius: '8px',
    border: `1.5px solid ${C.border}`, backgroundColor: C.creamDark, color: C.charcoal, cursor: 'pointer',
}
