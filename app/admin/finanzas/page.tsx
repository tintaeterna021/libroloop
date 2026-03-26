'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7', creamDark: '#EDE9D8', forest: '#1B3022',
    forestLight: '#2a4a34', charcoal: '#1A1A1A', mid: '#777',
    border: '#ddd9cc', gold: '#A67C00', goldBg: 'rgba(166,124,0,0.1)',
    white: '#fff', red: '#c0392b', redBg: 'rgba(192,57,43,0.07)',
    blue: '#0050AA', blueBg: 'rgba(0,80,170,0.07)',
    green: '#1B5E20',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', serif"

// ─── Types ────────────────────────────────────────────────────────────────────
interface SellerBook {
    id: string
    title: string
    price: number
    ganancia1?: number
    ganancia2?: number
    option_chosen?: number   // from batch
    paid_out: boolean
    seller_earning?: number  // actual earning stored on book
}

interface SellerGroup {
    seller_id: string
    name: string
    email: string
    phone?: string
    bank_name?: string
    clabe?: string
    bank_alias?: string
    books: SellerBook[]
    balance: number          // total unpaid
}

interface Payment {
    id: string
    seller_id: string
    amount: number
    receipt_url?: string
    paid_at: string
    seller?: { name?: string; email?: string }
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminFinanzasPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes')

    // data
    const [sellers, setSellers] = useState<SellerGroup[]>([])
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

    // UI state
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [payModal, setPayModal] = useState<SellerGroup | null>(null)
    const [toast, setToast] = useState('')

    // summary KPIs
    const totalPending = sellers.reduce((s, g) => s + g.balance, 0)
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { router.push('/login'); return }
            const { data: p } = await supabase.from('profiles').select('roles').eq('id', user.id).single()
            if (!JSON.stringify(p?.roles || []).includes('admin')) { router.push('/'); return }
            setChecking(false)
            load()
        })
    }, [router])

    async function load() {
        await Promise.all([loadPending(), loadHistory()])
        setLoading(false)
    }

    async function loadPending() {
        const { data: soldBooks } = await supabase
            .from('books')
            .select('id,title,price,seller_id,paid_out,seller_earning,ganancia1,ganancia2,profiles(id,name,email,phone,bank_name,clabe,bank_alias)')
            .eq('status', 'sold')
            .eq('paid_out', false)

        if (!soldBooks) return

        const map: Record<string, SellerGroup> = {}
        soldBooks.forEach((b: any) => {
            const sid = b.seller_id
            if (!sid) return
            if (!map[sid]) {
                map[sid] = {
                    seller_id: sid,
                    name: b.profiles?.name || b.profiles?.email || 'Sin nombre',
                    email: b.profiles?.email || '',
                    phone: b.profiles?.phone || '',
                    bank_name: b.profiles?.bank_name || '',
                    clabe: b.profiles?.clabe || '',
                    bank_alias: b.profiles?.bank_alias || '',
                    books: [],
                    balance: 0,
                }
            }
            const earning = b.seller_earning ?? b.ganancia1 ?? 0
            map[sid].books.push({ id: b.id, title: b.title, price: b.price, seller_earning: earning, paid_out: false })
            map[sid].balance += earning
        })

        // sort by balance descending
        setSellers(Object.values(map).sort((a, b) => b.balance - a.balance))
    }

    async function loadHistory() {
        const { data } = await supabase
            .from('seller_payments')
            .select('id,seller_id,amount,receipt_url,paid_at,profiles(name,email)')
            .order('paid_at', { ascending: false })
            .limit(100)

        setPayments((data || []).map((p: any) => ({ ...p, seller: p.profiles })))
    }

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000) }

    async function handleMarkPaid(seller: SellerGroup, receiptUrl?: string) {
        const { data: { user } } = await supabase.auth.getUser()
        const bookIds = seller.books.map(b => b.id)

        // 1) Insert payment record
        await supabase.from('seller_payments').insert({
            seller_id: seller.seller_id,
            amount: seller.balance,
            book_ids: bookIds,
            receipt_url: receiptUrl || null,
            created_by: user?.id,
        })

        // 2) Mark books as paid
        await supabase.from('books').update({ paid_out: true }).in('id', bookIds)

        // 3) Update local state
        setSellers(prev => prev.filter(s => s.seller_id !== seller.seller_id))
        setPayModal(null)
        showToast(`✅ Pago de $${seller.balance.toFixed(0)} registrado para ${seller.name}`)
        loadHistory()

        // 4) WhatsApp notification link (opened externally)
        if (seller.phone) {
            const msg = encodeURIComponent(
                `¡Hola ${seller.name}! 💸\n\n*Dinero en camino.* Te hemos transferido *$${seller.balance.toFixed(0)}* por tus ventas en Libroloop.\n\nGracias por confiar en nosotros 📚`
            )
            window.open(`https://wa.me/52${seller.phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
        }
    }

    function toggleExpand(id: string) {
        setExpanded(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    if (checking) return <Spin full />

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.cream, display: 'flex', flexDirection: 'column' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
                @keyframes slideModal { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: none; } }
                @keyframes expand { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
            `}</style>

            {/* ── Top bar ── */}
            <div style={{ backgroundColor: C.forest, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20 }}>
                <button onClick={() => router.push('/admin')}
                    style={{ background: 'none', border: 'none', color: 'rgba(245,242,231,0.6)', cursor: 'pointer', fontFamily: SANS, fontSize: '0.82rem' }}>
                    ← Admin
                </button>
                <h1 style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: C.cream, margin: 0, flex: 1 }}>
                    💰 Finanzas y Pagos
                </h1>
                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: '0.3rem', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.2rem' }}>
                    {(['pendientes', 'historial'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            fontFamily: SANS, fontWeight: 600, fontSize: '0.73rem',
                            padding: '0.35rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            backgroundColor: tab === t ? C.cream : 'transparent',
                            color: tab === t ? C.forest : 'rgba(245,242,231,0.6)',
                            transition: 'all 0.15s',
                        }}>
                            {t === 'pendientes' ? '⏳ Pendientes' : '📋 Historial'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, padding: '1.1rem 1.25rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>

                {/* ── Health Panel ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
                    <HealthCard
                        label="Total por Pagar"
                        sublabel="Deuda actual con vendedores"
                        value={`$${totalPending.toFixed(0)}`}
                        accent={totalPending > 0 ? C.red : C.forest}
                        icon="⚠️"
                    />
                    <HealthCard
                        label="Total Pagado"
                        sublabel="Generado históricamente"
                        value={`$${totalPaid.toFixed(0)}`}
                        accent={C.forest}
                        icon="🏆"
                    />
                </div>

                {loading ? <Spin full={false} /> : tab === 'pendientes' ? (
                    <>
                        {/* Contextual note */}
                        <div style={{ backgroundColor: C.creamDark, borderRadius: '10px', padding: '0.65rem 0.9rem', marginBottom: '1rem', fontFamily: SANS, fontSize: '0.77rem', color: C.mid, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            📅 <span>Cortes de pago los <strong>días 15 y 30</strong> de cada mes</span>
                        </div>

                        {/* Seller list */}
                        {sellers.length === 0
                            ? <Empty text="¡Todo al día! No hay saldos pendientes. 🎉" />
                            : sellers.map(seller => (
                                <SellerRow
                                    key={seller.seller_id}
                                    seller={seller}
                                    open={expanded.has(seller.seller_id)}
                                    onToggle={() => toggleExpand(seller.seller_id)}
                                    onPay={() => setPayModal(seller)}
                                />
                            ))
                        }
                    </>
                ) : (
                    /* ── History tab ── */
                    <div>
                        {payments.length === 0
                            ? <Empty text="No hay pagos registrados aún." />
                            : (
                                <div style={{ backgroundColor: C.white, borderRadius: '14px', border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
                                    {/* Header */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 50px', backgroundColor: C.creamDark, borderBottom: `1.5px solid ${C.border}` }}>
                                        {['Vendedor / Fecha', 'Monto', 'Comprobante', ''].map((h, i) => (
                                            <div key={i} style={{ padding: '0.7rem 0.9rem', fontFamily: SANS, fontWeight: 700, fontSize: '0.67rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</div>
                                        ))}
                                    </div>
                                    {payments.map((p, idx) => (
                                        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 50px', borderBottom: idx < payments.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                                            <div style={{ padding: '0.7rem 0.9rem' }}>
                                                <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem', color: C.charcoal, margin: '0 0 0.1rem' }}>{p.seller?.name || p.seller?.email || '—'}</p>
                                                <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, margin: 0 }}>
                                                    {new Date(p.paid_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div style={{ padding: '0 0.9rem', textAlign: 'right' }}>
                                                <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.95rem', color: C.forest }}>${p.amount?.toFixed(0)}</span>
                                            </div>
                                            <div style={{ padding: '0 0.9rem', textAlign: 'right' }}>
                                                {p.receipt_url
                                                    ? <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SANS, fontSize: '0.73rem', fontWeight: 600, color: C.blue, textDecoration: 'none' }}>Ver 📎</a>
                                                    : <span style={{ fontFamily: SANS, fontSize: '0.68rem', color: '#ccc' }}>—</span>
                                                }
                                            </div>
                                            <div style={{ padding: '0 0.75rem', textAlign: 'right' }}>
                                                <span style={{ fontFamily: SANS, fontSize: '0.68rem', color: '#bbb' }}>✓</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </div>
                )}
            </div>

            {/* ── Payment modal ── */}
            {payModal && (
                <PayModal
                    seller={payModal}
                    onConfirm={handleMarkPaid}
                    onClose={() => setPayModal(null)}
                />
            )}

            {/* ── Toast ── */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: C.forest, color: C.cream, fontFamily: SANS, fontWeight: 600, fontSize: '0.85rem', padding: '0.7rem 1.5rem', borderRadius: '999px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 200, whiteSpace: 'nowrap', animation: 'fadeUp 0.3s ease' }}>
                    {toast}
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH CARD
// ══════════════════════════════════════════════════════════════════════════════
function HealthCard({ label, sublabel, value, accent, icon }: { label: string; sublabel: string; value: string; accent: string; icon: string }) {
    return (
        <div style={{ backgroundColor: C.white, borderRadius: '16px', padding: '1.25rem', border: `2px solid ${accent}22`, boxShadow: '0 2px 12px rgba(27,48,34,0.06)' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: accent, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.78rem', color: C.charcoal, marginTop: '0.4rem' }}>{label}</div>
            <div style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, marginTop: '0.15rem' }}>{sublabel}</div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// SELLER ROW (accordion)
// ══════════════════════════════════════════════════════════════════════════════
function SellerRow({ seller, open, onToggle, onPay }: { seller: SellerGroup; open: boolean; onToggle: () => void; onPay: () => void }) {
    return (
        <div style={{ backgroundColor: C.white, borderRadius: '14px', border: `1.5px solid ${C.border}`, marginBottom: '0.65rem', overflow: 'hidden', boxShadow: '0 2px 10px rgba(27,48,34,0.05)' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.1rem' }}>
                {/* Toggle */}
                <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: C.mid, flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
                    ▼
                </button>

                {/* Name + books count */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.9rem', color: C.charcoal, margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {seller.name}
                    </p>
                    <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid, margin: 0 }}>
                        {seller.books.length} libro{seller.books.length !== 1 ? 's' : ''} vendido{seller.books.length !== 1 ? 's' : ''} · {seller.phone || seller.email}
                    </p>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginRight: '0.75rem' }}>
                    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.3rem', color: C.gold }}>${seller.balance.toFixed(0)}</div>
                    <div style={{ fontFamily: SANS, fontSize: '0.65rem', color: C.mid }}>pendiente</div>
                </div>

                {/* Pay button */}
                <button onClick={onPay} style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.78rem', padding: '0.5rem 0.9rem', borderRadius: '9px', border: 'none', backgroundColor: C.forest, color: C.cream, cursor: 'pointer', flexShrink: 0, boxShadow: '0 3px 10px rgba(27,48,34,0.2)' }}>
                    Pagar ahora
                </button>
            </div>

            {/* Expanded detail */}
            {open && (
                <div style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.creamDark, padding: '0.75rem 1.1rem 0.85rem', animation: 'expand 0.2s ease' }}>
                    <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.67rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Desglose de libros</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {seller.books.map(b => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: `1px solid ${C.border}` }}>
                                <span style={{ fontFamily: SANS, fontSize: '0.78rem', color: C.charcoal, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.75rem' }}>
                                    • {b.title}
                                </span>
                                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.78rem', color: C.forest, flexShrink: 0 }}>
                                    ${(b.seller_earning || 0).toFixed(0)}
                                </span>
                            </div>
                        ))}
                    </div>
                    {seller.clabe && (
                        <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, marginTop: '0.65rem' }}>
                            🏦 {seller.bank_name || 'Banco'} · CLABE: <strong>{seller.clabe}</strong>
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENT MODAL
// ══════════════════════════════════════════════════════════════════════════════
function PayModal({ seller, onConfirm, onClose }: { seller: SellerGroup; onConfirm: (s: SellerGroup, receipt?: string) => void; onClose: () => void }) {
    const [receiptUrl, setReceiptUrl] = useState<string | undefined>()
    const [uploading, setUploading] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)
    const [confirming, setConfirming] = useState(false)

    function copy(text: string, key: string) {
        navigator.clipboard.writeText(text)
        setCopied(key)
        setTimeout(() => setCopied(null), 2000)
    }

    async function uploadReceipt(file: File) {
        setUploading(true)
        const path = `receipts/${seller.seller_id}_${Date.now()}.${file.name.split('.').pop()}`
        const { error } = await supabase.storage.from('payment-receipts').upload(path, file, { upsert: true })
        if (!error) {
            const { data } = supabase.storage.from('payment-receipts').getPublicUrl(path)
            setReceiptUrl(data.publicUrl)
        }
        setUploading(false)
    }

    async function confirm() {
        setConfirming(true)
        await onConfirm(seller, receiptUrl)
        setConfirming(false)
    }

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 80, backdropFilter: 'blur(3px)' }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 'min(480px, 95vw)', maxHeight: '92vh', overflowY: 'auto',
                backgroundColor: C.cream, borderRadius: '20px', zIndex: 90,
                padding: '1.5rem', boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
                animation: 'slideModal 0.2s ease',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                        <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.05rem', color: C.charcoal, margin: '0 0 0.2rem' }}>
                            Pagar a {seller.name}
                        </h2>
                        <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, margin: 0 }}>{seller.email}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: C.mid }}>✕</button>
                </div>

                {/* Amount (big) */}
                <div style={{ backgroundColor: C.forest, borderRadius: '14px', padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                    <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: 'rgba(245,242,231,0.6)', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Monto exacto a transferir</p>
                    <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '2.2rem', color: C.cream, margin: 0, lineHeight: 1 }}>
                        ${seller.balance.toFixed(2)}
                    </p>
                    <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: 'rgba(245,242,231,0.5)', margin: '0.4rem 0 0' }}>
                        {seller.books.length} libro{seller.books.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Banking data */}
                <div style={{ backgroundColor: C.white, borderRadius: '12px', border: `1.5px solid ${C.border}`, padding: '1rem', marginBottom: '1.25rem' }}>
                    <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.68rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem' }}>🏦 Datos Bancarios</p>

                    <BankRow label="Nombre" value={seller.name} onCopy={() => copy(seller.name, 'name')} copied={copied === 'name'} />

                    {seller.bank_name
                        ? <BankRow label="Banco" value={seller.bank_name} onCopy={() => copy(seller.bank_name!, 'bank')} copied={copied === 'bank'} />
                        : <p style={{ fontFamily: SANS, fontSize: '0.75rem', color: '#ccc', margin: '0.3rem 0' }}>Banco: <em>no registrado</em></p>
                    }

                    {seller.clabe ? (
                        <BankRow label="CLABE" value={seller.clabe} mono onCopy={() => copy(seller.clabe!, 'clabe')} copied={copied === 'clabe'} highlight />
                    ) : (
                        <div style={{ backgroundColor: C.redBg, borderRadius: '8px', padding: '0.55rem 0.75rem', fontFamily: SANS, fontSize: '0.78rem', color: C.red }}>
                            ⚠️ Este vendedor no ha registrado su CLABE. Pregúntale por WhatsApp antes de pagar.
                        </div>
                    )}
                </div>

                {/* Receipt upload */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.68rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>📎 Comprobante de Transferencia</p>
                    <label style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '0.4rem', padding: '1.25rem', borderRadius: '12px',
                        border: `2px dashed ${receiptUrl ? C.forest : C.border}`,
                        backgroundColor: receiptUrl ? 'rgba(27,48,34,0.04)' : C.white,
                        cursor: 'pointer', textAlign: 'center',
                    }}>
                        {uploading ? (
                            <Spin full={false} />
                        ) : receiptUrl ? (
                            <>
                                <span style={{ fontSize: '1.5rem' }}>✅</span>
                                <span style={{ fontFamily: SANS, fontSize: '0.78rem', color: C.forest, fontWeight: 600 }}>Comprobante cargado</span>
                                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.blue }}>Ver archivo</a>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '1.5rem' }}>📸</span>
                                <span style={{ fontFamily: SANS, fontSize: '0.78rem', color: C.mid }}>Arrastra o haz clic para subir tu captura</span>
                                <span style={{ fontFamily: SANS, fontSize: '0.65rem', color: '#ccc' }}>PNG, JPG, PDF</span>
                            </>
                        )}
                        <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt(f) }} />
                    </label>
                </div>

                {/* Confirm button */}
                <button onClick={confirm} disabled={confirming} style={{
                    width: '100%', backgroundColor: confirming ? '#aaa' : C.forest,
                    color: C.cream, fontFamily: SANS, fontWeight: 700, fontSize: '0.95rem',
                    border: 'none', borderRadius: '13px', padding: '0.95rem',
                    cursor: confirming ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(27,48,34,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}>
                    {confirming ? <Spin full={false} /> : '✅'} {confirming ? 'Registrando…' : 'Marcar como Pagado'}
                </button>

                <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, textAlign: 'center', marginTop: '0.65rem' }}>
                    Esto notificará a {seller.name} por WhatsApp y actualizará su dashboard.
                </p>
            </div>
        </>
    )
}

// ── BankRow ────────────────────────────────────────────────────────────────────
function BankRow({ label, value, onCopy, copied, mono, highlight }: {
    label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean; highlight?: boolean
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f0ede4', gap: '0.5rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: SANS, fontSize: '0.62rem', color: C.mid, margin: '0 0 0.05rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <p style={{
                    fontFamily: mono ? "'Courier New', monospace" : SANS,
                    fontSize: highlight ? '1rem' : '0.82rem',
                    fontWeight: 700,
                    color: highlight ? C.blue : C.charcoal,
                    margin: 0, letterSpacing: mono ? '0.08em' : 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {value}
                </p>
            </div>
            <button onClick={onCopy} style={{
                flexShrink: 0, fontFamily: SANS, fontWeight: 700, fontSize: '0.7rem',
                padding: '0.3rem 0.65rem', borderRadius: '7px',
                border: `1.5px solid ${copied ? C.forest : C.border}`,
                backgroundColor: copied ? 'rgba(27,48,34,0.08)' : C.creamDark,
                color: copied ? C.forest : C.mid, cursor: 'pointer', transition: 'all 0.15s',
            }}>
                {copied ? '✓' : 'Copiar'}
            </button>
        </div>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Empty({ text }: { text: string }) {
    return <div style={{ textAlign: 'center', padding: '3rem 1rem', fontFamily: SANS, fontSize: '0.9rem', color: C.mid, backgroundColor: C.white, borderRadius: '14px', border: `1.5px solid ${C.border}` }}>{text}</div>
}
function Spin({ full }: { full: boolean }) {
    const spinner = <div style={{ width: '22px', height: '22px', border: '3px solid rgba(27,48,34,0.15)', borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    if (!full) return spinner
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream }}>
            {spinner}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
