'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7', creamDark: '#EDE9D8', forest: '#1B3022',
    forestLight: '#2a4a34', charcoal: '#1A1A1A', mid: '#666',
    border: '#ddd9cc', gold: '#A67C00', goldBg: 'rgba(166,124,0,0.1)',
    white: '#fff', red: '#c0392b', blue: '#0050AA', blueBg: 'rgba(0,80,170,0.08)',
    green: '#1B5E20',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', 'Playfair Display', serif"

// ─── Pricing engine ───────────────────────────────────────────────────────────
function roundToNearest10(x: number): number {
    const base = Math.floor(x / 10) * 10
    const rem = x - base
    return rem >= 2.5 ? base + 10 : base
}
function roundToNearest5(x: number): number {
    return Math.round(x / 5) * 5
}
function calcPrices(newPrice: number) {
    const raw = newPrice * 0.55
    const salePrice = roundToNearest10(raw)
    const g1Raw = salePrice * 0.60
    const g2Raw = salePrice * 0.50
    return {
        salePrice,
        ganancia1: roundToNearest5(g1Raw),
        ganancia2: roundToNearest5(g2Raw),
    }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Batch {
    id: string
    seller_id: string
    status: string
    option_chosen: number | null
    created_at: string
    seller?: { name?: string; email?: string; phone?: string }
    bookCount?: number
}

interface BatchBook {
    id: string
    title?: string
    author?: string
    price?: number
    status: string
    image_url?: string
    back_image_url?: string
    isbn?: string
    new_price?: number
    sale_price?: number
    ganancia1?: number
    ganancia2?: number
    rejection_reason?: string
    clean_cover_url?: string
    batch_id?: string
}

const BATCH_STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    new: { label: 'Nuevo', color: C.blue, bg: C.blueBg, dot: '🔵' },
    waiting_response: { label: 'Esperando respuesta', color: '#7A6000', bg: 'rgba(255,200,0,0.1)', dot: '🟡' },
    approved: { label: 'Aprobado', color: C.forest, bg: 'rgba(27,48,34,0.08)', dot: '🟢' },
    published: { label: 'Publicado', color: C.green, bg: 'rgba(27,94,32,0.08)', dot: '✅' },
    rejected: { label: 'Rechazado', color: C.red, bg: 'rgba(192,57,43,0.06)', dot: '🔴' },
}

const REJECT_REASONS = ['Mal estado', 'Muy viejo (antes de 2001)', 'Fotos poco claras', 'Sin contraportada', 'Páginas sueltas o manchas']
const ISBN_SOURCES = [
    { name: 'Amazon MX', url: (isbn: string) => `https://www.amazon.com.mx/s?k=${isbn}` },
    { name: 'Gandhi', url: (isbn: string) => `https://www.gandhi.com.mx/catalogsearch/result/?q=${isbn}` },
    { name: 'El Sótano', url: (isbn: string) => `https://www.elsotano.com/busquedaCompleta?campo=isbn&buscar=${isbn}` },
    { name: 'Mercado Libre', url: (isbn: string) => `https://listado.mercadolibre.com.mx/${isbn}` },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminLotesPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [view, setView] = useState<'bandeja' | 'workspace' | 'closure' | 'publish'>('bandeja')
    const [batches, setBatches] = useState<Batch[]>([])
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
    const [batchBooks, setBatchBooks] = useState<BatchBook[]>([])
    const [currentBookIdx, setCurrentBookIdx] = useState(0)

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { router.push('/login'); return }
            const { data: p } = await supabase.from('profiles').select('roles').eq('id', user.id).single()
            if (!JSON.stringify(p?.roles || []).includes('admin')) { router.push('/'); return }
            setChecking(false)
            loadBatches()
        })
    }, [router])

    async function loadBatches() {
        // Fetch batches + seller profile + book count
        const { data: batchData } = await supabase
            .from('seller_batches')
            .select('*')
            .order('created_at', { ascending: true })

        if (!batchData) return

        // Enrich with seller info and book count
        const enriched: Batch[] = await Promise.all(batchData.map(async (b) => {
            const [profileRes, countRes] = await Promise.all([
                supabase.from('profiles').select('name,email,phone').eq('id', b.seller_id).single(),
                supabase.from('books').select('*', { count: 'exact', head: true }).eq('batch_id', b.id),
            ])
            return { ...b, seller: profileRes.data || {}, bookCount: countRes.count || 0 }
        }))

        setBatches(enriched)
    }

    async function openBatch(batch: Batch) {
        setSelectedBatch(batch)
        const { data } = await supabase
            .from('books')
            .select('*')
            .eq('batch_id', batch.id)
            .order('created_at', { ascending: true })
        setBatchBooks((data as BatchBook[]) || [])
        setCurrentBookIdx(0)
        setView('workspace')
    }

    function updateBook(idx: number, changes: Partial<BatchBook>) {
        setBatchBooks(prev => prev.map((b, i) => i === idx ? { ...b, ...changes } : b))
    }

    async function saveBatchStatus(status: string) {
        if (!selectedBatch) return
        await supabase.from('seller_batches').update({ status }).eq('id', selectedBatch.id)
        setSelectedBatch(prev => prev ? { ...prev, status } : null)
        setBatches(prev => prev.map(b => b.id === selectedBatch.id ? { ...b, status } : b))
    }

    async function applyOptionAndPublish(option: 1 | 2) {
        if (!selectedBatch) return
        const approved = batchBooks.filter(b => b.status === 'approved_local')
        const gananciaField = option === 1 ? 'ganancia1' : 'ganancia2'

        for (const book of approved) {
            const profit = option === 1 ? book.ganancia1 : book.ganancia2
            await supabase.from('books').update({
                status: 'available',
                price: book.sale_price,
                seller_earning: profit,
                image_url: book.clean_cover_url || book.image_url,
            }).eq('id', book.id)
        }

        // Reject the others
        const rejected = batchBooks.filter(b => b.status === 'rejected_local')
        for (const book of rejected) {
            await supabase.from('books').update({ status: 'rejected', rejection_reason: book.rejection_reason }).eq('id', book.id)
        }

        await supabase.from('seller_batches').update({ status: 'published', option_chosen: option }).eq('id', selectedBatch.id)
        setView('bandeja')
        loadBatches()
    }

    if (checking) return <Spinner />

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.cream }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>

            {/* ── Top bar ── */}
            <div style={{ backgroundColor: C.forest, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
                <button onClick={() => { if (view !== 'bandeja') setView('bandeja'); else router.push('/admin') }}
                    style={{ background: 'none', border: 'none', color: 'rgba(245,242,231,0.6)', cursor: 'pointer', fontFamily: SANS, fontSize: '0.82rem' }}>
                    ← {view === 'bandeja' ? 'Admin' : 'Bandeja'}
                </button>
                <h1 style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: C.cream, margin: 0, flex: 1 }}>
                    {view === 'bandeja' ? '📥 Aprobación de Lotes' : view === 'workspace' ? `📦 Lote de ${selectedBatch?.seller?.name || '—'}` : view === 'closure' ? '💬 Cerrar Lote' : '🚀 Publicar Lote'}
                </h1>
                {view === 'workspace' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <NavBtn active={false} onClick={() => setView('closure')}>Cerrar Lote →</NavBtn>
                    </div>
                )}
            </div>

            {/* ── Views ── */}
            {view === 'bandeja' && (
                <Bandeja batches={batches} onOpen={openBatch} onReload={loadBatches} />
            )}
            {view === 'workspace' && selectedBatch && (
                <Workspace
                    batch={selectedBatch}
                    books={batchBooks}
                    currentIdx={currentBookIdx}
                    onSetIdx={setCurrentBookIdx}
                    onUpdateBook={updateBook}
                    onGoClose={() => setView('closure')}
                />
            )}
            {view === 'closure' && selectedBatch && (
                <CierreLote
                    batch={selectedBatch}
                    books={batchBooks}
                    onWaiting={() => { saveBatchStatus('waiting_response'); setView('bandeja') }}
                    onNextLevel={() => setView('publish')}
                />
            )}
            {view === 'publish' && selectedBatch && (
                <PublishLote
                    batch={selectedBatch}
                    books={batchBooks}
                    onUpdateBook={updateBook}
                    onPublish={applyOptionAndPublish}
                />
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// LEVEL 1: BANDEJA
// ══════════════════════════════════════════════════════════════════════════════
function Bandeja({ batches, onOpen, onReload }: { batches: Batch[]; onOpen: (b: Batch) => void; onReload: () => void }) {
    const byStatus: Record<string, Batch[]> = {}
    batches.forEach(b => { byStatus[b.status] = [...(byStatus[b.status] || []), b] })
    const order = ['new', 'waiting_response', 'approved', 'published', 'rejected']

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
            <p style={{ fontFamily: SANS, fontSize: '0.8rem', color: C.mid, marginBottom: '1.5rem' }}>
                {batches.length} lotes · ordenados del más antiguo al más reciente
            </p>

            {batches.length === 0 && <p style={{ fontFamily: SANS, fontSize: '0.9rem', color: C.mid, textAlign: 'center', padding: '3rem' }}>No hay lotes aún.</p>}

            {order.map(status => {
                const list = byStatus[status] || []
                if (list.length === 0) return null
                const cfg = BATCH_STATUS_CFG[status]
                return (
                    <div key={status} style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.75rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingBottom: '0.35rem', borderBottom: `2px solid rgba(27,48,34,0.08)` }}>
                            {cfg.dot} {cfg.label} ({list.length})
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {list.map(batch => (
                                <button key={batch.id} onClick={() => onOpen(batch)}
                                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                                    <div style={{
                                        backgroundColor: C.white, borderRadius: '13px',
                                        padding: '1rem 1.1rem', border: `1.5px solid ${C.border}`,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        boxShadow: '0 2px 8px rgba(27,48,34,0.05)',
                                        transition: 'box-shadow 0.15s',
                                    }}>
                                        <div>
                                            <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.95rem', color: C.charcoal, margin: '0 0 0.15rem' }}>
                                                📦 {batch.seller?.name || batch.seller?.email || 'Sin nombre'}
                                            </p>
                                            <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, margin: 0 }}>
                                                {batch.bookCount} libro{batch.bookCount !== 1 ? 's' : ''} · {new Date(batch.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                                {batch.seller?.phone && ` · ${batch.seller.phone}`}
                                            </p>
                                        </div>
                                        <span style={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                                            {cfg.dot} {cfg.label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// LEVEL 2: WORKSPACE
// ══════════════════════════════════════════════════════════════════════════════
function Workspace({ batch, books, currentIdx, onSetIdx, onUpdateBook, onGoClose }: {
    batch: Batch; books: BatchBook[]; currentIdx: number
    onSetIdx: (i: number) => void; onUpdateBook: (i: number, c: Partial<BatchBook>) => void
    onGoClose: () => void
}) {
    const book = books[currentIdx]
    const total = books.length
    const approvedCount = books.filter(b => b.status === 'approved_local').length
    const allDone = books.every(b => b.status === 'approved_local' || b.status === 'rejected_local')

    if (!book) return <p style={{ padding: '2rem', fontFamily: SANS, color: C.mid }}>Este lote no tiene libros registrados.</p>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 53px)', overflow: 'hidden' }}>

            {/* Progress bar */}
            <div style={{ backgroundColor: '#eee', height: '3px', flexShrink: 0 }}>
                <div style={{ height: '100%', backgroundColor: C.forest, width: `${((currentIdx + 1) / total) * 100}%`, transition: 'width 0.3s' }} />
            </div>

            {/* Body: two columns */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

                {/* ── Columna Izquierda: carrusel visual ── */}
                <div style={{ flex: '1 1 50%', overflowY: 'auto', padding: '1.25rem', borderRight: `1px solid ${C.border}`, backgroundColor: C.creamDark }}>
                    {/* Carousel nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.8rem', color: C.mid }}>
                            Libro {currentIdx + 1} de {total}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                            {books.map((b, i) => (
                                <button key={i} onClick={() => onSetIdx(i)} style={{
                                    width: '24px', height: '24px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                                    backgroundColor: i === currentIdx ? C.forest : b.status === 'approved_local' ? '#4CAF50' : b.status === 'rejected_local' ? C.red : C.border,
                                    transition: 'background-color 0.2s',
                                }} />
                            ))}
                        </div>
                    </div>

                    {/* Front cover */}
                    <p style={{ fontFamily: SANS, fontSize: '0.7rem', fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Portada</p>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ddd', marginBottom: '0.85rem', aspectRatio: '3/4', maxHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {book.image_url
                            ? <img src={book.image_url} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            : <span style={{ fontSize: '2rem' }}>📚</span>
                        }
                    </div>

                    {/* Back cover with zoom */}
                    <p style={{ fontFamily: SANS, fontSize: '0.7rem', fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Contraportada <span style={{ fontWeight: 400, color: '#aaa' }}>(hover = zoom)</span></p>
                    <BackCoverZoom url={book.back_image_url} />

                    {/* Nav buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button onClick={() => onSetIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                            style={{ flex: 1, padding: '0.55rem', borderRadius: '9px', border: `1.5px solid ${C.border}`, backgroundColor: C.white, fontFamily: SANS, fontSize: '0.8rem', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentIdx === 0 ? 0.4 : 1 }}>
                            ← Anterior
                        </button>
                        <button onClick={() => onSetIdx(Math.min(total - 1, currentIdx + 1))} disabled={currentIdx === total - 1}
                            style={{ flex: 1, padding: '0.55rem', borderRadius: '9px', border: `1.5px solid ${C.border}`, backgroundColor: C.white, fontFamily: SANS, fontSize: '0.8rem', cursor: currentIdx === total - 1 ? 'not-allowed' : 'pointer', opacity: currentIdx === total - 1 ? 0.4 : 1 }}>
                            Siguiente →
                        </button>
                    </div>
                </div>

                {/* ── Columna Derecha: captura y motor ── */}
                <div style={{ flex: '1 1 50%', overflowY: 'auto', padding: '1.25rem', backgroundColor: C.white }}>
                    <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.95rem', color: C.charcoal, margin: '0 0 0.15rem' }}>
                        {book.title || 'Sin título'}
                    </p>
                    <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: C.mid, marginBottom: '1.1rem' }}>
                        {book.author || 'Autor desconocido'}
                    </p>

                    {/* ISBN field */}
                    <BookField label="ISBN">
                        <input
                            type="text"
                            defaultValue={book.isbn || ''}
                            placeholder="Escribe el ISBN y presiona Enter"
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim()
                                    onUpdateBook(currentIdx, { isbn: val })
                                }
                            }}
                            onBlur={e => onUpdateBook(currentIdx, { isbn: e.target.value.trim() })}
                            style={inputStyle}
                        />
                    </BookField>

                    {/* ISBN search links */}
                    {book.isbn && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.65rem', backgroundColor: C.creamDark, borderRadius: '10px' }}>
                            <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, width: '100%', margin: '0 0 0.35rem' }}>🔍 Buscar precio nuevo:</p>
                            {ISBN_SOURCES.map(s => (
                                <a key={s.name} href={s.url(book.isbn!)} target="_blank" rel="noopener noreferrer"
                                    style={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 600, color: C.blue, textDecoration: 'none', padding: '0.25rem 0.6rem', border: `1.5px solid ${C.blue}`, borderRadius: '7px', backgroundColor: C.blueBg }}>
                                    {s.name} ↗
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Precio nuevo */}
                    <BookField label="Precio de libro nuevo ($)">
                        <input
                            type="number"
                            value={book.new_price || ''}
                            placeholder="Ej. 225"
                            onChange={e => {
                                const np = parseFloat(e.target.value) || 0
                                const prices = np > 0 ? calcPrices(np) : { salePrice: 0, ganancia1: 0, ganancia2: 0 }
                                onUpdateBook(currentIdx, { new_price: np, ...prices })
                            }}
                            style={inputStyle}
                        />
                    </BookField>

                    {/* Calculated prices */}
                    {book.new_price && book.new_price > 0 && (
                        <div style={{ backgroundColor: C.creamDark, borderRadius: '12px', padding: '1rem', marginBottom: '1rem', animation: 'fadeIn 0.2s ease' }}>
                            <PriceRow label="Precio Nuevo (ingresado)" value={`$${book.new_price}`} bold />
                            <div style={{ borderTop: `1px dashed ${C.border}`, margin: '0.5rem 0' }} />
                            <PriceRow label="💎 Precio Venta Libroloop" value={`$${book.sale_price}`} accent={C.forest} big />
                            <div style={{ borderTop: `1px dashed ${C.border}`, margin: '0.5rem 0' }} />
                            <PriceRow label="🏪 Ganancia 1 (Nosotros almacenamos — 60%)" value={`$${book.ganancia1}`} accent={C.blue} />
                            <PriceRow label="🏡 Ganancia 2 (Ellos almacenan — 50%)" value={`$${book.ganancia2}`} accent={C.gold} />

                            {/* Editable overrides */}
                            <p style={{ fontFamily: SANS, fontSize: '0.67rem', color: '#aaa', marginTop: '0.6rem' }}>Ajustar si es necesario:</p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                                <OverrideInput label="P. Venta" value={book.sale_price} onSave={v => onUpdateBook(currentIdx, { sale_price: v })} />
                                <OverrideInput label="G1" value={book.ganancia1} onSave={v => onUpdateBook(currentIdx, { ganancia1: v })} />
                                <OverrideInput label="G2" value={book.ganancia2} onSave={v => onUpdateBook(currentIdx, { ganancia2: v })} />
                            </div>
                        </div>
                    )}

                    {/* Decision buttons */}
                    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                        <DecisionBtn
                            color={C.red} label="🔴 Rechazar"
                            active={book.status === 'rejected_local'}
                            onClick={() => { }} // handled below with reason
                        />
                        <DecisionBtn
                            color={C.forest} label="🟢 Aprobar"
                            active={book.status === 'approved_local'}
                            onClick={() => {
                                onUpdateBook(currentIdx, { status: 'approved_local' })
                                if (currentIdx < books.length - 1) setTimeout(() => onSetIdx(currentIdx + 1), 250)
                            }}
                        />
                    </div>

                    {/* Reject reasons */}
                    {book.status !== 'approved_local' && (
                        <RejectPanel
                            selected={book.rejection_reason || ''}
                            onSelect={(r) => onUpdateBook(currentIdx, { status: 'rejected_local', rejection_reason: r })}
                        />
                    )}

                    {/* Status badge */}
                    {book.status === 'approved_local' && (
                        <div style={{ backgroundColor: 'rgba(27,48,34,0.07)', borderRadius: '9px', padding: '0.6rem 0.85rem', fontFamily: SANS, fontSize: '0.8rem', color: C.forest, fontWeight: 600 }}>
                            ✅ Aprobado — listo para el cierre del lote
                        </div>
                    )}
                    {book.status === 'rejected_local' && (
                        <div style={{ backgroundColor: 'rgba(192,57,43,0.07)', borderRadius: '9px', padding: '0.6rem 0.85rem', fontFamily: SANS, fontSize: '0.8rem', color: C.red, fontWeight: 600 }}>
                            ❌ Rechazado: {book.rejection_reason || 'sin razón'}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom action bar */}
            {allDone && (
                <div style={{ padding: '0.85rem 1.25rem', backgroundColor: C.white, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
                    <span style={{ fontFamily: SANS, fontSize: '0.82rem', color: C.mid }}>
                        {approvedCount} aprobados · {books.length - approvedCount} rechazados
                    </span>
                    <button onClick={onGoClose} style={{ backgroundColor: C.forest, color: C.cream, fontFamily: SANS, fontWeight: 700, fontSize: '0.9rem', borderRadius: '10px', padding: '0.65rem 1.5rem', border: 'none', cursor: 'pointer' }}>
                        Cerrar Lote →
                    </button>
                </div>
            )}
        </div>
    )
}

// ── BackCoverZoom ─────────────────────────────────────────────────────────────
function BackCoverZoom({ url }: { url?: string }) {
    const [zoom, setZoom] = useState(false)
    const [origin, setOrigin] = useState('50% 50%')
    const ref = useRef<HTMLDivElement>(null)

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!ref.current) return
        const { left, top, width, height } = ref.current.getBoundingClientRect()
        const x = ((e.clientX - left) / width) * 100
        const y = ((e.clientY - top) / height) * 100
        setOrigin(`${x}% ${y}%`)
    }

    return (
        <div ref={ref} style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ddd', aspectRatio: '3/4', maxHeight: '260px', cursor: zoom ? 'zoom-out' : 'zoom-in', position: 'relative' }}
            onMouseEnter={() => setZoom(true)} onMouseLeave={() => setZoom(false)} onMouseMove={handleMouseMove}>
            {url
                ? <img src={url} alt="Contraportada" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: zoom ? 'scale(2.5)' : 'scale(1)', transformOrigin: origin, transition: 'transform 0.15s ease' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>🔍</span>
                    <span style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid }}>Sin contraportada</span>
                </div>
            }
        </div>
    )
}

// ── RejectPanel ───────────────────────────────────────────────────────────────
function RejectPanel({ selected, onSelect }: { selected: string; onSelect: (r: string) => void }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {REJECT_REASONS.map(r => (
                <button key={r} onClick={() => onSelect(r)} style={{
                    fontFamily: SANS, fontSize: '0.72rem', fontWeight: selected === r ? 700 : 400,
                    padding: '0.3rem 0.65rem', borderRadius: '7px',
                    border: `1.5px solid ${selected === r ? C.red : C.border}`,
                    backgroundColor: selected === r ? 'rgba(192,57,43,0.08)' : C.white,
                    color: selected === r ? C.red : C.mid,
                    cursor: 'pointer',
                }}>
                    {r}
                </button>
            ))}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// LEVEL 3: CIERRE DE LOTE + WHATSAPP
// ══════════════════════════════════════════════════════════════════════════════
function CierreLote({ batch, books, onWaiting, onNextLevel }: {
    batch: Batch; books: BatchBook[]
    onWaiting: () => void; onNextLevel: () => void
}) {
    const [copied, setCopied] = useState(false)
    const approved = books.filter(b => b.status === 'approved_local')
    const rejected = books.filter(b => b.status === 'rejected_local')
    const sellerName = batch.seller?.name?.split(' ')[0] || 'Hola'

    const waMessage = `Hola ${sellerName}, ¡buenas noticias! 📚

Hemos evaluado tus libros, te explico la comisión que varía dependiendo de la recolección:

🚚 *Opción 1: Pasamos por todos los libros en una sola vez. Ganas el 60% de la venta.*
Por ejemplo, de un libro de $200, ganas $120.
_(Necesita +5 libros que quieras vender)_

🏡 *Opción 2: Guardas tus libros. La venta es 50/50.*
Del mismo libro de $200, ganarías $100.

Siempre sugerimos la *Opción 1*. Liberas espacio de inmediato, ganas más por cada libro y no te molestamos cada vez que se venda un libro.

*Libros aprobados (${approved.length}):*
${approved.map(b => `  • ${b.title} — $${b.sale_price || '—'}`).join('\n')}
${rejected.length > 0 ? `\n*No pasan el filtro de calidad (${rejected.length}):*\n${rejected.map(b => `  • ${b.title}`).join('\n')}` : ''}

¿Qué opción prefieres para publicar tus libros? 😊`

    function copyMsg() {
        navigator.clipboard.writeText(waMessage)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    const waPhone = batch.seller?.phone?.replace(/\D/g, '') || ''
    const waLink = `https://wa.me/52${waPhone}?text=${encodeURIComponent(waMessage)}`

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
            {/* Summary cards */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <SumCard icon="✅" label="Aprobados" value={approved.length} color={C.forest} />
                <SumCard icon="❌" label="Rechazados" value={rejected.length} color={C.red} />
            </div>

            {/* Approved list */}
            {approved.length > 0 && (
                <div style={{ backgroundColor: C.white, borderRadius: '12px', padding: '1rem', border: `1.5px solid ${C.border}`, marginBottom: '1rem' }}>
                    <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.75rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>Libros aprobados</p>
                    {approved.map(b => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: `1px solid ${C.creamDark}` }}>
                            <span style={{ fontFamily: SANS, fontSize: '0.8rem', color: C.charcoal }}>{b.title}</span>
                            <span style={{ fontFamily: SANS, fontSize: '0.8rem', fontWeight: 700, color: C.forest }}>${b.sale_price}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* WhatsApp message */}
            <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.78rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>💬 Mensaje para WhatsApp</p>
            <div style={{ backgroundColor: '#f0f7ee', border: '1.5px solid #c8e6c9', borderRadius: '12px', padding: '1.1rem', marginBottom: '1rem', whiteSpace: 'pre-wrap', fontFamily: SANS, fontSize: '0.82rem', lineHeight: 1.65, color: '#1a2a1f' }}>
                {waMessage}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <button onClick={copyMsg} style={{
                    backgroundColor: copied ? C.forest : C.white, color: copied ? C.cream : C.charcoal,
                    fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem',
                    padding: '0.65rem 1.1rem', borderRadius: '10px',
                    border: `1.5px solid ${C.border}`, cursor: 'pointer', transition: 'all 0.2s',
                }}>
                    {copied ? '✓ Copiado!' : '📋 Copiar Mensaje'}
                </button>

                {waPhone && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                        backgroundColor: '#25D366', color: C.white,
                        fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem',
                        padding: '0.65rem 1.1rem', borderRadius: '10px',
                        textDecoration: 'none', display: 'inline-block',
                    }}>
                        💬 Abrir WhatsApp
                    </a>
                )}

                <button onClick={onWaiting} style={{
                    backgroundColor: 'rgba(255,200,0,0.1)', color: '#7A6000',
                    fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem',
                    padding: '0.65rem 1.1rem', borderRadius: '10px',
                    border: '1.5px solid rgba(255,200,0,0.3)', cursor: 'pointer',
                }}>
                    ⏸️ Esperar respuesta
                </button>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                <p style={{ fontFamily: SANS, fontSize: '0.8rem', color: C.mid, marginBottom: '0.65rem' }}>
                    ¿El cliente ya eligió su opción? Continúa a la publicación:
                </p>
                <button onClick={onNextLevel} style={{
                    backgroundColor: C.forest, color: C.cream,
                    fontFamily: SANS, fontWeight: 700, fontSize: '0.9rem',
                    padding: '0.8rem 1.75rem', borderRadius: '12px',
                    border: 'none', cursor: 'pointer',
                }}>
                    → Ir a Publicar el Lote
                </button>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// LEVEL 4: PUBLICACIÓN FINAL
// ══════════════════════════════════════════════════════════════════════════════
function PublishLote({ batch, books, onUpdateBook, onPublish }: {
    batch: Batch; books: BatchBook[]; onUpdateBook: (i: number, c: Partial<BatchBook>) => void
    onPublish: (option: 1 | 2) => void
}) {
    const [option, setOption] = useState<1 | 2>(1)
    const [publishing, setPublishing] = useState(false)
    const approved = books.filter(b => b.status === 'approved_local')

    async function uploadCover(idx: number, bookId: string, file: File) {
        const path = `clean-covers/${bookId}_${Date.now()}.jpg`
        const { error } = await supabase.storage.from('seller-submissions').upload(path, file, { upsert: true })
        if (!error) {
            const { data } = supabase.storage.from('seller-submissions').getPublicUrl(path)
            onUpdateBook(idx, { clean_cover_url: data.publicUrl })
        }
    }

    async function handlePublish() {
        setPublishing(true)
        await onPublish(option)
        setPublishing(false)
    }

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
            {/* Option selector */}
            <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.78rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Opción elegida por el cliente</p>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                    {([1, 2] as const).map(opt => (
                        <button key={opt} onClick={() => setOption(opt)} style={{
                            flex: 1, padding: '0.85rem 0.5rem', borderRadius: '12px', cursor: 'pointer',
                            border: `2px solid ${option === opt ? C.forest : C.border}`,
                            backgroundColor: option === opt ? 'rgba(27,48,34,0.06)' : C.white,
                            fontFamily: SANS,
                        }}>
                            <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{opt === 1 ? '🚚' : '🏡'}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: option === opt ? C.forest : C.charcoal }}>Opción {opt}</div>
                            <div style={{ fontSize: '0.72rem', color: C.mid, marginTop: '0.2rem' }}>{opt === 1 ? 'Nosotros almacenamos (60%)' : 'Ellos almacenan (50%)'}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cover uploads */}
            <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.78rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Subir portadas limpias para el catálogo
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {approved.map((book, i) => {
                    const realIdx = books.findIndex(b => b.id === book.id)
                    return (
                        <div key={book.id} style={{ backgroundColor: C.white, borderRadius: '12px', padding: '0.9rem 1rem', border: `1.5px solid ${C.border}`, display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                            {/* Current cover preview */}
                            <div style={{ width: '44px', height: '58px', borderRadius: '7px', overflow: 'hidden', backgroundColor: C.creamDark, flexShrink: 0 }}>
                                {(book.clean_cover_url || book.image_url)
                                    ? <img src={book.clean_cover_url || book.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📚</div>
                                }
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.82rem', color: C.charcoal, margin: '0 0 0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
                                <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid, margin: 0 }}>
                                    ${book.sale_price} · {option === 1 ? `G1: $${book.ganancia1}` : `G2: $${book.ganancia2}`}
                                </p>
                            </div>

                            <label style={{ flexShrink: 0, cursor: 'pointer', backgroundColor: book.clean_cover_url ? 'rgba(27,48,34,0.07)' : C.creamDark, borderRadius: '8px', padding: '0.4rem 0.75rem', fontFamily: SANS, fontSize: '0.72rem', fontWeight: 600, color: book.clean_cover_url ? C.forest : C.mid, border: `1.5px dashed ${C.border}` }}>
                                {book.clean_cover_url ? '✓ Subida' : '+ Portada'}
                                <input type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) uploadCover(realIdx, book.id, file)
                                    }} />
                            </label>
                        </div>
                    )
                })}
            </div>

            {/* Publish button */}
            <button onClick={handlePublish} disabled={publishing} style={{
                width: '100%', backgroundColor: publishing ? C.forestLight : C.forest,
                color: C.cream, fontFamily: SANS, fontWeight: 700, fontSize: '1rem',
                borderRadius: '14px', padding: '1rem', border: 'none',
                cursor: publishing ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(27,48,34,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
                {publishing ? <Spin /> : '🚀'} {publishing ? 'Publicando…' : 'PUBLICAR LOTE EN TIENDA'}
            </button>
        </div>
    )
}

// ─── Mini helpers ─────────────────────────────────────────────────────────────
function BookField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontFamily: SANS, fontSize: '0.7rem', fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</label>
            {children}
        </div>
    )
}
function PriceRow({ label, value, accent, bold, big }: { label: string; value?: number | string; accent?: string; bold?: boolean; big?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontFamily: SANS, fontSize: big ? '0.85rem' : '0.75rem', color: C.charcoal, fontWeight: bold ? 700 : 400 }}>{label}</span>
            <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: big ? '1.1rem' : '0.95rem', color: accent || C.charcoal }}>{value}</span>
        </div>
    )
}
function OverrideInput({ label, value, onSave }: { label: string; value?: number; onSave: (v: number) => void }) {
    return (
        <div style={{ flex: 1 }}>
            <p style={{ fontFamily: SANS, fontSize: '0.62rem', color: C.mid, margin: '0 0 0.2rem' }}>{label}</p>
            <input type="number" defaultValue={value} onBlur={e => onSave(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '0.35rem 0.45rem', borderRadius: '7px', border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
    )
}
function DecisionBtn({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            flex: 1, padding: '0.65rem', borderRadius: '10px', cursor: 'pointer',
            border: `2px solid ${active ? color : C.border}`,
            backgroundColor: active ? color : C.white,
            color: active ? C.white : C.mid,
            fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem',
            transition: 'all 0.15s',
        }}>{label}</button>
    )
}
function SumCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
    return (
        <div style={{ flex: 1, backgroundColor: C.white, borderRadius: '12px', padding: '0.9rem 1rem', border: `1.5px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>{icon}</div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.6rem', color, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid }}>{label}</div>
        </div>
    )
}
function NavBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            fontFamily: SANS, fontWeight: 600, fontSize: '0.78rem', padding: '0.45rem 0.9rem',
            borderRadius: '8px', border: 'none', cursor: 'pointer',
            backgroundColor: active ? C.cream : 'rgba(245,242,231,0.15)',
            color: active ? C.forest : C.cream, transition: 'all 0.15s',
        }}>{children}</button>
    )
}
function Spinner() {
    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream }}>
            <div style={{ width: '28px', height: '28px', border: `3px solid rgba(27,48,34,0.15)`, borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
function Spin() {
    return <div style={{ width: '18px', height: '18px', border: `2px solid rgba(245,242,231,0.3)`, borderTopColor: C.cream, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
}
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.8rem', borderRadius: '9px',
    border: `1.5px solid #ddd9cc`, fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.88rem', outline: 'none', backgroundColor: '#FAFAF6',
    boxSizing: 'border-box',
}
