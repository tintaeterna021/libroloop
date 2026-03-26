'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7', creamDark: '#EDE9D8', forest: '#1B3022',
    forestLight: '#2a4a34', charcoal: '#1A1A1A', mid: '#777',
    border: '#ddd9cc', gold: '#A67C00', goldBg: 'rgba(166,124,0,0.08)',
    white: '#fff', red: '#c0392b', redBg: 'rgba(192,57,43,0.07)',
    blue: '#0050AA', blueBg: 'rgba(0,80,170,0.07)',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', serif"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Book {
    id: string
    title: string
    author: string
    price: number
    status: string
    image_url?: string
    isbn?: string
    description?: string
    modalidad?: string        // 'bodega' | 'vendedor'
    seller_id?: string
    created_at: string
    seller?: { name?: string; email?: string; phone?: string }
}

const DELIST_REASONS = [
    'Se dañó en bodega',
    'El vendedor lo pidió de regreso',
    'Más antiguo de 25 años',
    'Duplicado en catálogo',
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminInventarioPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)

    // ── Filter state ──────────────────────────────────────────────────────────
    const [query, setQuery] = useState('')
    const [filterModalidad, setFilterModalidad] = useState('all')
    const [filterAge, setFilterAge] = useState('all')

    // ── Selection ─────────────────────────────────────────────────────────────
    const [selected, setSelected] = useState<Set<string>>(new Set())

    // ── Menus & modals ────────────────────────────────────────────────────────
    const [openMenu, setOpenMenu] = useState<string | null>(null)
    const [editBook, setEditBook] = useState<Book | null>(null)
    const [delistBook, setDelistBook] = useState<Book | null>(null)
    const [priceBook, setPriceBook] = useState<Book | null>(null)
    const [toast, setToast] = useState('')

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { router.push('/login'); return }
            const { data: p } = await supabase.from('profiles').select('roles').eq('id', user.id).single()
            if (!JSON.stringify(p?.roles || []).includes('admin')) { router.push('/'); return }
            setChecking(false)
            loadBooks()
        })
    }, [router])

    async function loadBooks() {
        const { data } = await supabase
            .from('books')
            .select('id,title,author,price,status,image_url,isbn,description,modalidad,seller_id,created_at,profiles(name,email,phone)')
            .in('status', ['available', 'revision', 'rejected'])
            .order('created_at', { ascending: false })

        const enriched = (data || []).map((b: any) => ({ ...b, seller: b.profiles }))
        setBooks(enriched as Book[])
        setLoading(false)
    }

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

    // ── Derived filtered list ─────────────────────────────────────────────────
    const q = query.toLowerCase()
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const filtered = books.filter(b => {
        if (q && !(
            b.title?.toLowerCase().includes(q) ||
            b.author?.toLowerCase().includes(q) ||
            b.isbn?.toLowerCase().includes(q) ||
            b.seller?.name?.toLowerCase().includes(q) ||
            b.seller?.email?.toLowerCase().includes(q)
        )) return false

        if (filterModalidad !== 'all' && b.modalidad !== filterModalidad) return false
        if (filterAge === 'old' && new Date(b.created_at) >= sixMonthsAgo) return false
        return true
    })

    // ── Selection helpers ─────────────────────────────────────────────────────
    const allChecked = filtered.length > 0 && filtered.every(b => selected.has(b.id))
    function toggleAll() {
        if (allChecked) setSelected(new Set())
        else setSelected(new Set(filtered.map(b => b.id)))
    }
    function toggleOne(id: string) {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    // ── Book actions ──────────────────────────────────────────────────────────
    async function saveEdit(bookId: string, patch: Partial<Book>) {
        await supabase.from('books').update(patch).eq('id', bookId)
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, ...patch } : b))
        setEditBook(null)
        showToast('✅ Libro actualizado')
    }

    async function updatePrice(bookId: string, price: number) {
        await supabase.from('books').update({ price }).eq('id', bookId)
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, price } : b))
        setPriceBook(null)
        showToast(`💰 Precio actualizado a $${price}`)
    }

    async function delistOne(bookId: string, reason: string) {
        await supabase.from('books').update({ status: 'delisted', rejection_reason: reason }).eq('id', bookId)
        setBooks(prev => prev.filter(b => b.id !== bookId))
        setDelistBook(null)
        showToast('🗑️ Libro dado de baja')
    }

    async function bulkDelist() {
        const ids = Array.from(selected)
        await supabase.from('books').update({ status: 'delisted' }).in('id', ids)
        setBooks(prev => prev.filter(b => !selected.has(b.id)))
        setSelected(new Set())
        showToast(`🗑️ ${ids.length} libros dados de baja`)
    }

    if (checking) return <Spinner />

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.cream, display: 'flex', flexDirection: 'column' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
                @keyframes slideModal { from { opacity: 0; transform: scale(0.96) translateY(12px); } to { opacity: 1; transform: none; } }
                .menu-btn:hover { background-color: rgba(27,48,34,0.06) !important; }
                .row-hover:hover { background-color: rgba(240,237,226,0.6); }
            `}</style>

            {/* ── Top bar ── */}
            <div style={{ backgroundColor: C.forest, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20 }}>
                <button onClick={() => router.push('/admin')}
                    style={{ background: 'none', border: 'none', color: 'rgba(245,242,231,0.6)', cursor: 'pointer', fontFamily: SANS, fontSize: '0.82rem' }}>
                    ← Admin
                </button>
                <h1 style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: C.cream, margin: 0, flex: 1 }}>
                    📚 Inventario General
                </h1>
                <span style={{ fontFamily: SANS, fontSize: '0.72rem', color: 'rgba(245,242,231,0.5)' }}>
                    {filtered.length} de {books.length} libros
                </span>
            </div>

            <div style={{ flex: 1, padding: '1.1rem 1.25rem', overflowY: 'auto' }}>

                {/* ── Search + Filters ── */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ flex: '1 1 260px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Título, autor, ISBN o vendedor…"
                            style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.1rem', borderRadius: '10px', border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: '0.85rem', outline: 'none', backgroundColor: C.white, boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Modalidad filter */}
                    <select value={filterModalidad} onChange={e => setFilterModalidad(e.target.value)}
                        style={selectStyle}>
                        <option value="all">📦 Todas las modalidades</option>
                        <option value="bodega">🏪 En Bodega LibroLoop</option>
                        <option value="vendedor">🏡 Con el Vendedor</option>
                    </select>

                    {/* Antigüedad filter */}
                    <select value={filterAge} onChange={e => setFilterAge(e.target.value)}
                        style={selectStyle}>
                        <option value="all">🗓 Cualquier antigüedad</option>
                        <option value="old">⚠️ Más de 6 meses sin venderse</option>
                    </select>
                </div>

                {/* ── Bulk action bar ── */}
                {selected.size > 0 && (
                    <div style={{ backgroundColor: C.forest, borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeUp 0.2s ease' }}>
                        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem', color: C.cream, flex: 1 }}>
                            {selected.size} libro{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
                        </span>
                        <button onClick={bulkDelist} style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.75rem', padding: '0.4rem 0.85rem', borderRadius: '8px', backgroundColor: C.red, color: C.white, border: 'none', cursor: 'pointer' }}>
                            🗑️ Dar de baja
                        </button>
                        <button onClick={() => setSelected(new Set())} style={{ fontFamily: SANS, fontSize: '0.75rem', color: 'rgba(245,242,231,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                    </div>
                )}

                {/* ── Data Grid ── */}
                {loading ? <Spinner /> : (
                    <div style={{ backgroundColor: C.white, borderRadius: '14px', border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>

                        {/* Header row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 140px 90px 70px 40px', gap: '0', backgroundColor: C.creamDark, borderBottom: `1.5px solid ${C.border}`, padding: '0' }}>
                            <ColHead center>
                                <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: C.forest, cursor: 'pointer' }} />
                            </ColHead>
                            <ColHead>Libro</ColHead>
                            <ColHead>Vendedor</ColHead>
                            <ColHead right>Precio</ColHead>
                            <ColHead right>En tienda</ColHead>
                            <ColHead center />
                        </div>

                        {/* Rows */}
                        {filtered.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', fontFamily: SANS, fontSize: '0.85rem', color: C.mid }}>
                                No se encontraron libros con esos filtros.
                            </div>
                        )}

                        {filtered.map((book, idx) => {
                            const days = Math.floor((Date.now() - new Date(book.created_at).getTime()) / 86400000)
                            const isOld = days > 180
                            const isSelected = selected.has(book.id)

                            return (
                                <div key={book.id} className="row-hover"
                                    style={{
                                        display: 'grid', gridTemplateColumns: '36px 1fr 140px 90px 70px 40px',
                                        borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                                        alignItems: 'center',
                                        backgroundColor: isSelected ? 'rgba(27,48,34,0.04)' : 'transparent',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Checkbox */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem 0' }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleOne(book.id)}
                                            style={{ accentColor: C.forest, cursor: 'pointer' }} />
                                    </div>

                                    {/* Thumbnail + Title/Author */}
                                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', padding: '0.6rem 0.5rem 0.6rem 0' }}>
                                        <div style={{ width: '36px', height: '48px', borderRadius: '5px', overflow: 'hidden', backgroundColor: C.creamDark, flexShrink: 0 }}>
                                            {book.image_url
                                                ? <img src={book.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📚</div>
                                            }
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.82rem', color: C.charcoal, margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {book.title}
                                            </p>
                                            <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: C.mid, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {book.author}
                                            </p>
                                            <StatusBadge status={book.status} />
                                        </div>
                                    </div>

                                    {/* Seller */}
                                    <div style={{ padding: '0 0.5rem' }}>
                                        <p style={{ fontFamily: SANS, fontSize: '0.73rem', color: C.charcoal, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {book.seller?.name || book.seller?.email || '—'}
                                        </p>
                                        {book.modalidad && (
                                            <p style={{ fontFamily: SANS, fontSize: '0.62rem', color: C.mid, margin: 0 }}>
                                                {book.modalidad === 'bodega' ? '🏪 Bodega' : '🏡 Vendedor'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div style={{ padding: '0 0.5rem', textAlign: 'right' }}>
                                        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.88rem', color: C.forest }}>
                                            ${book.price?.toFixed(0)}
                                        </span>
                                    </div>

                                    {/* Days counter */}
                                    <div style={{ padding: '0 0.35rem', textAlign: 'right' }}>
                                        <span style={{
                                            fontFamily: SANS, fontWeight: 700, fontSize: '0.75rem',
                                            color: isOld ? C.red : days > 90 ? C.gold : C.forest,
                                        }}>
                                            {days}d
                                        </span>
                                        {isOld && <div style={{ fontSize: '0.55rem', color: C.red, fontFamily: SANS }}>⚠️ viejo</div>}
                                    </div>

                                    {/* 3-dot menu */}
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <button
                                            onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === book.id ? null : book.id) }}
                                            className="menu-btn"
                                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: '1rem', color: C.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }}>
                                            ⋮
                                        </button>

                                        {openMenu === book.id && (
                                            <ContextMenu
                                                onEdit={() => { setEditBook(book); setOpenMenu(null) }}
                                                onPrice={() => { setPriceBook(book); setOpenMenu(null) }}
                                                onDelist={() => { setDelistBook(book); setOpenMenu(null) }}
                                                onClose={() => setOpenMenu(null)}
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Click-outside dismiss menus ── */}
            {openMenu && <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 5 }} />}

            {/* ── Modals ── */}
            {editBook && <EditModal book={editBook} onSave={saveEdit} onClose={() => setEditBook(null)} />}
            {priceBook && <PriceModal book={priceBook} onSave={updatePrice} onClose={() => setPriceBook(null)} />}
            {delistBook && <DelistModal book={delistBook} onConfirm={delistOne} onClose={() => setDelistBook(null)} />}

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
// CONTEXT MENU
// ══════════════════════════════════════════════════════════════════════════════
function ContextMenu({ onEdit, onPrice, onDelist, onClose }: { onEdit: () => void; onPrice: () => void; onDelist: () => void; onClose: () => void }) {
    return (
        <div style={{
            position: 'absolute', right: '0', top: '100%', zIndex: 50,
            backgroundColor: C.white, borderRadius: '10px',
            border: `1.5px solid ${C.border}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: '170px', overflow: 'hidden',
            animation: 'fadeUp 0.15s ease',
        }}
            onClick={e => e.stopPropagation()}>
            <MenuItem icon="✏️" label="Editar detalles" onClick={onEdit} />
            <MenuItem icon="📉" label="Ajustar precio" onClick={onPrice} />
            <MenuItem icon="🗑️" label="Dar de baja" onClick={onDelist} danger />
        </div>
    )
}
function MenuItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
    return (
        <button onClick={onClick} style={{
            width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.65rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: SANS, fontWeight: 500, fontSize: '0.8rem',
            color: danger ? C.red : C.charcoal,
            borderBottom: '1px solid rgba(0,0,0,0.04)',
            transition: 'background-color 0.1s',
        }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = danger ? C.redBg : C.creamDark)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            <span style={{ flexShrink: 0 }}>{icon}</span> {label}
        </button>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// EDIT MODAL
// ══════════════════════════════════════════════════════════════════════════════
function EditModal({ book, onSave, onClose }: { book: Book; onSave: (id: string, patch: Partial<Book>) => void; onClose: () => void }) {
    const [title, setTitle] = useState(book.title || '')
    const [author, setAuthor] = useState(book.author || '')
    const [isbn, setIsbn] = useState(book.isbn || '')
    const [description, setDescription] = useState(book.description || '')

    return (
        <Modal title={`✏️ Editar — ${book.title}`} onClose={onClose}>
            {/* Cover preview */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ width: '52px', height: '68px', borderRadius: '8px', overflow: 'hidden', backgroundColor: C.creamDark, flexShrink: 0 }}>
                    {book.image_url ? <img src={book.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📚</span>}
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid, margin: '0 0 0.3rem' }}>Para cambiar las fotos, usa el módulo de Lotes.</p>
                </div>
            </div>

            <FieldGroup label="Título">
                <input value={title} onChange={e => setTitle(e.target.value)} style={inputSt} />
            </FieldGroup>
            <FieldGroup label="Autor">
                <input value={author} onChange={e => setAuthor(e.target.value)} style={inputSt} />
            </FieldGroup>
            <FieldGroup label="ISBN">
                <input value={isbn} onChange={e => setIsbn(e.target.value)} style={inputSt} />
            </FieldGroup>
            <FieldGroup label="Sinopsis">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...inputSt, resize: 'vertical' }} />
            </FieldGroup>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
                <SolidBtn color={C.forest} onClick={() => onSave(book.id, { title, author, isbn, description })}>Guardar Cambios</SolidBtn>
            </div>
        </Modal>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// PRICE MODAL
// ══════════════════════════════════════════════════════════════════════════════
function PriceModal({ book, onSave, onClose }: { book: Book; onSave: (id: string, price: number) => void; onClose: () => void }) {
    const [newPrice, setNewPrice] = useState(book.price || 0)
    const discount = book.price > 0 ? Math.round((1 - newPrice / book.price) * 100) : 0

    return (
        <Modal title={`📉 Ajustar precio — ${book.title}`} onClose={onClose}>
            <div style={{ backgroundColor: C.creamDark, borderRadius: '10px', padding: '0.85rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid, margin: '0 0 0.15rem' }}>Precio actual</p>
                    <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.2rem', color: C.charcoal, margin: 0 }}>${book.price?.toFixed(0)}</p>
                </div>
                {discount > 0 && (
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: SANS, fontSize: '0.7rem', color: C.mid, margin: '0 0 0.15rem' }}>Descuento</p>
                        <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.2rem', color: C.red, margin: 0 }}>−{discount}%</p>
                    </div>
                )}
            </div>

            <FieldGroup label="Nuevo precio de venta ($)">
                <input
                    type="number"
                    value={newPrice}
                    onChange={e => setNewPrice(parseFloat(e.target.value) || 0)}
                    style={{ ...inputSt, fontSize: '1.1rem', fontWeight: 700, color: C.forest }}
                />
            </FieldGroup>

            {newPrice > 0 && newPrice !== book.price && (
                <div style={{ backgroundColor: newPrice < book.price ? C.redBg : C.blueBg, borderRadius: '8px', padding: '0.55rem 0.75rem', marginBottom: '0.85rem', fontFamily: SANS, fontSize: '0.78rem', color: newPrice < book.price ? C.red : C.blue }}>
                    {newPrice < book.price
                        ? `📉 Bajas el precio ${discount}% ($${(book.price - newPrice).toFixed(0)} menos)`
                        : `📈 Subes el precio ($${(newPrice - book.price).toFixed(0)} más)`
                    }
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
                <SolidBtn color={C.forest} onClick={() => onSave(book.id, newPrice)}>Confirmar Precio</SolidBtn>
            </div>
        </Modal>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// DELIST MODAL
// ══════════════════════════════════════════════════════════════════════════════
function DelistModal({ book, onConfirm, onClose }: { book: Book; onConfirm: (id: string, reason: string) => void; onClose: () => void }) {
    const [reason, setReason] = useState('')

    return (
        <Modal title={`🗑️ Dar de baja — ${book.title}`} onClose={onClose}>
            <p style={{ fontFamily: SANS, fontSize: '0.82rem', color: C.charcoal, marginBottom: '1rem', lineHeight: 1.6 }}>
                Este libro se retirará del catálogo inmediatamente. Elige el motivo para el registro:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
                {DELIST_REASONS.map(r => (
                    <button key={r} onClick={() => setReason(r)} style={{
                        width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem',
                        borderRadius: '9px', cursor: 'pointer',
                        border: `2px solid ${reason === r ? C.red : C.border}`,
                        backgroundColor: reason === r ? C.redBg : C.white,
                        fontFamily: SANS, fontSize: '0.82rem',
                        color: reason === r ? C.red : C.charcoal, fontWeight: reason === r ? 700 : 400,
                        transition: 'all 0.15s',
                    }}>
                        {reason === r ? '● ' : '○ '}{r}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
                <SolidBtn color={C.red} onClick={() => reason && onConfirm(book.id, reason)} disabled={!reason}>
                    Confirmar Baja
                </SolidBtn>
            </div>
        </Modal>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED UI ATOMS
// ══════════════════════════════════════════════════════════════════════════════
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 80, backdropFilter: 'blur(2px)' }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 'min(480px, 95vw)', maxHeight: '90vh', overflowY: 'auto',
                backgroundColor: C.cream, borderRadius: '18px',
                zIndex: 90, padding: '1.5rem',
                boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                animation: 'slideModal 0.2s ease',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
                    <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1rem', color: C.charcoal, margin: 0, lineHeight: 1.4 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: C.mid, lineHeight: 1, padding: '0.1rem 0.25rem' }}>✕</button>
                </div>
                {children}
            </div>
        </>
    )
}
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontFamily: SANS, fontSize: '0.7rem', fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</label>
            {children}
        </div>
    )
}
function SolidBtn({ children, color, onClick, disabled }: { children: React.ReactNode; color: string; onClick?: () => void; disabled?: boolean }) {
    return (
        <button onClick={onClick} disabled={disabled} style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.82rem', padding: '0.55rem 1.1rem', borderRadius: '9px', border: 'none', backgroundColor: disabled ? '#ccc' : color, color: C.white, cursor: disabled ? 'not-allowed' : 'pointer' }}>
            {children}
        </button>
    )
}
function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{ fontFamily: SANS, fontWeight: 600, fontSize: '0.82rem', padding: '0.55rem 1rem', borderRadius: '9px', border: `1.5px solid ${C.border}`, backgroundColor: 'transparent', color: C.mid, cursor: 'pointer' }}>
            {children}
        </button>
    )
}
function ColHead({ children, right, center }: { children?: React.ReactNode; right?: boolean; center?: boolean }) {
    return (
        <div style={{ padding: '0.6rem 0.5rem', fontFamily: SANS, fontWeight: 700, fontSize: '0.68rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: center ? 'center' : right ? 'right' : 'left' }}>
            {children}
        </div>
    )
}
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; color: string; bg: string }> = {
        available: { label: 'Publicado', color: C.forest, bg: 'rgba(27,48,34,0.08)' },
        revision: { label: 'En revisión', color: '#7A6000', bg: 'rgba(255,200,0,0.1)' },
        rejected: { label: 'Rechazado', color: C.red, bg: C.redBg },
    }
    const s = map[status] ?? map.revision
    return (
        <span style={{ display: 'inline-block', fontFamily: SANS, fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', backgroundColor: s.bg, color: s.color, marginTop: '0.2rem' }}>
            {s.label}
        </span>
    )
}
function Spinner() {
    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(27,48,34,0.15)', borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

const inputSt: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '9px',
    border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: '0.87rem',
    outline: 'none', backgroundColor: C.white, boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = {
    padding: '0.6rem 0.75rem', borderRadius: '10px', border: `1.5px solid ${C.border}`,
    fontFamily: SANS, fontSize: '0.82rem', outline: 'none', backgroundColor: C.white,
    cursor: 'pointer', flex: '0 0 auto',
}
