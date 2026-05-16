'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Book } from '@/lib/types'
import Link from 'next/link'
import { useCart } from '@/lib/CartContext'

const CATEGORIES: { value: string; label: string; icon: string }[] = [
    { value: "Autoayuda y desarrollo personal", label: "Autoayuda y desarrollo personal", icon: "🌱" },
    { value: "Arte y fotografía", label: "Arte y fotografía", icon: "🎨" },
    { value: "Biografía y autobiografía", label: "Biografía y autobiografía", icon: "✍️" },
    { value: "Cocina y hogar", label: "Cocina y hogar", icon: "🍳" },
    { value: "Deportes", label: "Deportes", icon: "⚽" },
    { value: "Educación", label: "Educación", icon: "🎓" },
    { value: "Familia y relaciones", label: "Familia y relaciones", icon: "👨‍👩‍👧" },
    { value: "Ficción", label: "Ficción", icon: "📖" },
    { value: "Ficción juvenil", label: "Ficción juvenil", icon: "🧒" },
    { value: "Filosofía y pensamiento", label: "Filosofía y pensamiento", icon: "💭" },
    { value: "Historia", label: "Historia", icon: "🏛️" },
    { value: "Juvenil no ficción", label: "Juvenil no ficción", icon: "📘" },
    { value: "Negocios y economía", label: "Negocios y economía", icon: "💼" },
    { value: "Otros", label: "Otros", icon: "📦" },
    { value: "Religión y espiritualidad", label: "Religión y espiritualidad", icon: "✨" },
    { value: "Salud y bienestar", label: "Salud y bienestar", icon: "💚" },
    { value: "Tecnología y ciencia", label: "Tecnología y ciencia", icon: "🔬" },
]

const PRICE_MIN = 0
const PRICE_MAX = 2000
const PAGE_SIZE = 10

// ─── Custom dual-handle range slider ────────────────────────────────────────
function PriceRangeSlider({
    min, max, values, onChange,
}: {
    min: number; max: number; values: [number, number]; onChange: (v: [number, number]) => void
}) {
    const trackRef = useRef<HTMLDivElement>(null)
    const dragging = useRef<null | 'left' | 'right'>(null)

    const toPercent = (v: number) => ((v - min) / (max - min)) * 100

    const fromClientX = (clientX: number): number => {
        const rect = trackRef.current!.getBoundingClientRect()
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        return Math.round(min + ratio * (max - min))
    }

    const handleMouseDown = (handle: 'left' | 'right') => (e: React.MouseEvent) => {
        e.preventDefault()
        dragging.current = handle
    }

    const handleTouchStart = (handle: 'left' | 'right') => (e: React.TouchEvent) => {
        dragging.current = handle
    }

    useEffect(() => {
        const move = (clientX: number) => {
            if (!dragging.current || !trackRef.current) return
            const val = fromClientX(clientX)
            if (dragging.current === 'left') {
                onChange([Math.min(val, values[1] - 50), values[1]])
            } else {
                onChange([values[0], Math.max(val, values[0] + 50)])
            }
        }

        const onMouseMove = (e: MouseEvent) => move(e.clientX)
        const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientX)
        const onUp = () => { dragging.current = null }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchmove', onTouchMove)
        window.addEventListener('touchend', onUp)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onUp)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onUp)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values])

    const leftPct = toPercent(values[0])
    const rightPct = toPercent(values[1])

    return (
        <div style={{ padding: '0.5rem 0 0.25rem' }}>
            {/* Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#1B3022' }}>
                    ${values[0].toLocaleString('es-MX')}
                </span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', color: '#999' }}>
                    Precio
                </span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#1B3022' }}>
                    ${values[1].toLocaleString('es-MX')}
                </span>
            </div>

            {/* Track */}
            <div
                ref={trackRef}
                style={{
                    position: 'relative',
                    height: '6px',
                    borderRadius: '999px',
                    backgroundColor: '#e0ddd2',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
            >
                {/* Active range */}
                <div style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    right: `${100 - rightPct}%`,
                    top: 0, bottom: 0,
                    backgroundColor: '#1B3022',
                    borderRadius: '999px',
                }} />

                {/* Left handle */}
                <div
                    onMouseDown={handleMouseDown('left')}
                    onTouchStart={handleTouchStart('left')}
                    style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        border: '2.5px solid #1B3022',
                        cursor: 'grab',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                        zIndex: 2,
                        touchAction: 'none',
                        transition: 'box-shadow 0.15s',
                    }}
                />

                {/* Right handle */}
                <div
                    onMouseDown={handleMouseDown('right')}
                    onTouchStart={handleTouchStart('right')}
                    style={{
                        position: 'absolute',
                        left: `${rightPct}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        border: '2.5px solid #1B3022',
                        cursor: 'grab',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                        zIndex: 2,
                        touchAction: 'none',
                        transition: 'box-shadow 0.15s',
                    }}
                />
            </div>
        </div>
    )
}
// ────────────────────────────────────────────────────────────────────────────

const CATALOG_SESSION_KEY = 'libroloop_catalog_state'

export default function CatalogoPage() {
    const { addToCart, openCart } = useCart()
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    // ── Restaurar estado desde sessionStorage (solo una vez al montar) ────────
    const savedStateRef = useRef<{
        inputValue?: string
        searchTerm?: string
        scrollY?: number
        selectedCategory?: string
        appliedFilters?: {
            priceRange: [number, number]
            onlyWithDiscount: boolean
            sortBy: 'recent' | 'price_asc' | 'price_desc' | 'alpha' | 'discount'
        }
    } | null>(
        (() => {
            if (typeof window === 'undefined') return null
            try { return JSON.parse(sessionStorage.getItem(CATALOG_SESSION_KEY) || 'null') } catch { return null }
        })()
    )
    const saved = savedStateRef.current

    const [inputValue, setInputValue] = useState<string>(saved?.inputValue ?? '')
    const [searchTerm, setSearchTerm] = useState<string>(saved?.searchTerm ?? '')

    // Categoría seleccionada (single-select, '' = Todos)
    const [selectedCategory, setSelectedCategory] = useState<string>(saved?.selectedCategory ?? '')

    // Filters applied to the query
    const [appliedFilters, setAppliedFilters] = useState<{
        priceRange: [number, number]
        onlyWithDiscount: boolean
        sortBy: 'recent' | 'price_asc' | 'price_desc' | 'alpha' | 'discount'
    }>(saved?.appliedFilters ?? {
        priceRange: [PRICE_MIN, PRICE_MAX] as [number, number],
        onlyWithDiscount: false,
        sortBy: 'recent'
    })

    // Temporary filters in the UI (panel)
    const [tempPriceRange, setTempPriceRange] = useState<[number, number]>(saved?.appliedFilters?.priceRange ?? [PRICE_MIN, PRICE_MAX])
    const [tempOnlyWithDiscount, setTempOnlyWithDiscount] = useState<boolean>(saved?.appliedFilters?.onlyWithDiscount ?? false)

    const [filtersOpen, setFiltersOpen] = useState(false)
    const scrollRestoredRef = useRef(false)
    const catScrollRef = useRef<HTMLDivElement | null>(null)
    const catDragging = useRef(false)
    const catStartX = useRef(0)
    const catScrollLeft = useRef(0)

    const observerRef = useRef<IntersectionObserver | null>(null)
    const loaderRef = useRef<HTMLDivElement | null>(null)
    const pageRef = useRef(0)
    const isFetchingRef = useRef(false)

    const fetchBooks = useCallback(async (reset = false) => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true

        const currentPage = reset ? 0 : pageRef.current
        if (reset) setLoading(true); else setLoadingMore(true)

        try {
            let query = supabase.from('books').select('*').eq('status_code', 6)

            // Category single-select filter
            if (selectedCategory) {
                query = query.eq('genre', selectedCategory)
            }

            // Price filter
            query = query.gte('sale_price', appliedFilters.priceRange[0]).lte('sale_price', appliedFilters.priceRange[1])

            // Extra discount filter
            if (appliedFilters.onlyWithDiscount) {
                query = query.gt('extra_discount_percent', 0)
            }

            // Search
            if (searchTerm) {
                const normalize = (text: string) =>
                    text
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .trim();

                const cleanTerm = normalize(searchTerm).replace(/\s+/g, "%");

                query = query.or(
                    `title_normalized.ilike.%${cleanTerm}%,author_normalized.ilike.%${cleanTerm}%,isbn.ilike.%${cleanTerm}%`
                );
            }

            // Sorting logic
            let orderCol = 'published_at'
            let ascending = false

            if (appliedFilters.sortBy === 'price_asc') {
                orderCol = 'sale_price'; ascending = true
            } else if (appliedFilters.sortBy === 'price_desc') {
                orderCol = 'sale_price'; ascending = false
            } else if (appliedFilters.sortBy === 'alpha') {
                orderCol = 'title'; ascending = true
            } else if (appliedFilters.sortBy === 'discount') {
                orderCol = 'extra_discount_percent'; ascending = false
            }

            const { data, error } = await query
                .order(orderCol, { ascending })
                .order('id', { ascending: true })
                .range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1)

            if (error) {
                console.warn('Error fetching books:', error.message || error)
                return
            }

            if (reset) {
                setBooks(data || [])
                pageRef.current = 1
            } else {
                setBooks(prev => [...prev, ...(data || [])])
                pageRef.current = currentPage + 1
            }
            setHasMore((data || []).length === PAGE_SIZE)
        } catch (err) {
            console.warn('Error fetching books:', err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
            isFetchingRef.current = false

            // Restaurar scroll solo la primera vez que se cargan libros (vuelta del detalle)
            const scrollY = savedStateRef.current?.scrollY
            if (reset && !scrollRestoredRef.current && scrollY) {
                scrollRestoredRef.current = true
                requestAnimationFrame(() => {
                    window.scrollTo({ top: scrollY, behavior: 'instant' })
                })
            }
        }
    }, [appliedFilters, searchTerm, selectedCategory])

    const defaultAppliedFilters = {
        priceRange: [PRICE_MIN, PRICE_MAX] as [number, number],
        onlyWithDiscount: false,
        sortBy: 'recent' as const,
    }

    // Se activa SOLO cuando el usuario escribe; nunca al restaurar desde sessionStorage.
    // Esto evita que StrictMode (que monta efectos dos veces) borre los filtros al volver del detalle.
    const userHasTyped = useRef(false)

    // Debounce: solo resetea filtros si el usuario realmente escribió en el input
    useEffect(() => {
        if (!userHasTyped.current) return
        const timer = setTimeout(() => {
            setSearchTerm(inputValue.trim())
            setSelectedCategory('')
            setTempPriceRange([PRICE_MIN, PRICE_MAX])
            setTempOnlyWithDiscount(false)
            setAppliedFilters({ ...defaultAppliedFilters })
        }, 400)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue])

    // Guardar estado en sessionStorage cuando cambian filtros o búsqueda
    useEffect(() => {
        try {
            sessionStorage.setItem(CATALOG_SESSION_KEY, JSON.stringify({
                inputValue,
                searchTerm,
                selectedCategory,
                appliedFilters,
                scrollY: window.scrollY,
            }))
        } catch { /* ignorar errores de storage */ }
    }, [inputValue, searchTerm, selectedCategory, appliedFilters])

    // Guardar scroll en tiempo real para capturar la posición exacta al salir
    useEffect(() => {
        const saveScroll = () => {
            try {
                const current = JSON.parse(sessionStorage.getItem(CATALOG_SESSION_KEY) || '{}')
                sessionStorage.setItem(CATALOG_SESSION_KEY, JSON.stringify({ ...current, scrollY: window.scrollY }))
            } catch { /* ignorar */ }
        }
        window.addEventListener('scroll', saveScroll, { passive: true })
        return () => window.removeEventListener('scroll', saveScroll)
    }, [])

    useEffect(() => {
        fetchBooks(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters, searchTerm, selectedCategory])

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect()
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !isFetchingRef.current && hasMore) {
                fetchBooks(false)
            }
        }, { threshold: 0.1 })
        if (loaderRef.current) observerRef.current.observe(loaderRef.current)
        return () => observerRef.current?.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchBooks, hasMore, books])

    const handleApplyFilters = () => {
        setAppliedFilters(prev => ({
            ...prev,
            priceRange: tempPriceRange,
            onlyWithDiscount: tempOnlyWithDiscount
        }))
        setFiltersOpen(false)
    }

    const handleClearFilters = () => {
        setSelectedCategory('')
        setTempPriceRange([PRICE_MIN, PRICE_MAX])
        setTempOnlyWithDiscount(false)
        setAppliedFilters({
            priceRange: [PRICE_MIN, PRICE_MAX],
            onlyWithDiscount: false,
            sortBy: 'recent'
        })
    }

    const anyFilterApplied = !!selectedCategory ||
        appliedFilters.priceRange[0] !== PRICE_MIN ||
        appliedFilters.priceRange[1] !== PRICE_MAX ||
        appliedFilters.onlyWithDiscount ||
        appliedFilters.sortBy !== 'recent'

    return (
        <div style={{ backgroundColor: '#F5F2E7', minHeight: '100vh' }}>

            {/* Sticky header */}
            <div style={{ position: 'sticky', top: '64px', zIndex: 40 }}>

                {/* Search + filter button */}
                <div style={{ backgroundColor: '#1B3022', padding: '0.85rem 1rem' }}>
                    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Busca por título, autor o ISBN..."
                                value={inputValue}
                                onChange={e => {
                                    userHasTyped.current = true
                                    setInputValue(e.target.value)
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 2.6rem 0.75rem 2.8rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    backgroundColor: 'white',
                                    color: '#1A1A1A',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem' }}>🔍</span>
                            {inputValue && (
                                <button
                                    onClick={() => {
                                        userHasTyped.current = false
                                        setInputValue('')
                                        setSearchTerm('')
                                    }}
                                    title="Borrar búsqueda"
                                    style={{
                                        position: 'absolute',
                                        right: '0.85rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#999',
                                        fontSize: '1rem',
                                        lineHeight: 1,
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#1B3022')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#999')}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Filters toggle button */}
                        <button
                            onClick={() => {
                                // When opening, sync temp filters with applied ones
                                if (!filtersOpen) {
                                    setTempPriceRange(appliedFilters.priceRange)
                                    setTempOnlyWithDiscount(appliedFilters.onlyWithDiscount)
                                }
                                setFiltersOpen(f => !f)
                            }}
                            style={{
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                backgroundColor: anyFilterApplied ? 'white' : 'rgba(255,255,255,0.15)',
                                color: anyFilterApplied ? '#1B3022' : 'white',
                                border: anyFilterApplied ? '2px solid white' : '2px solid rgba(255,255,255,0.35)',
                                padding: '0.55rem 1rem',
                                borderRadius: '999px',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                <path d="M1 3h14M3.5 8h9M6 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Filtros
                            {anyFilterApplied && (
                                <span style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    backgroundColor: '#1B3022', marginLeft: '2px',
                                }} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Filter panel (expandable) */}
                {filtersOpen && (
                    <div style={{
                        backgroundColor: '#fff',
                        borderBottom: '1px solid #e0ddd2',
                        padding: '1rem 1.25rem 1.25rem',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}>
                        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                            {/* Price range slider */}
                            <div>
                                <p style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.72rem', fontWeight: 700, color: '#999',
                                    textTransform: 'uppercase', letterSpacing: '0.07em',
                                    marginBottom: '0.4rem',
                                }}>Rango de Precio</p>
                                <PriceRangeSlider
                                    min={PRICE_MIN}
                                    max={PRICE_MAX}
                                    values={tempPriceRange}
                                    onChange={setTempPriceRange}
                                />
                            </div>

                            {/* Extra Discount Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    cursor: 'pointer',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: '#1B3022'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={tempOnlyWithDiscount}
                                        onChange={e => setTempOnlyWithDiscount(e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: '#1B3022', cursor: 'pointer' }}
                                    />
                                    Solo libros con descuento adicional
                                </label>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <button
                                    onClick={handleClearFilters}
                                    style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        color: '#999',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        padding: 0,
                                    }}
                                >
                                    Limpiar todos
                                </button>

                                <button
                                    onClick={handleApplyFilters}
                                    style={{
                                        backgroundColor: '#1B3022',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '999px',
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(27,48,34,0.2)'
                                    }}
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Book Grid */}
            <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>

                {/* Category pills row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                }}>

                    {/* Franja deslizable */}
                    <div
                        ref={catScrollRef}
                        onMouseDown={e => {
                            catDragging.current = true
                            catStartX.current = e.pageX - (catScrollRef.current?.offsetLeft ?? 0)
                            catScrollLeft.current = catScrollRef.current?.scrollLeft ?? 0
                            if (catScrollRef.current) catScrollRef.current.style.cursor = 'grabbing'
                        }}
                        onMouseLeave={() => {
                            catDragging.current = false
                            if (catScrollRef.current) catScrollRef.current.style.cursor = 'grab'
                        }}
                        onMouseUp={() => {
                            catDragging.current = false
                            if (catScrollRef.current) catScrollRef.current.style.cursor = 'grab'
                        }}
                        onMouseMove={e => {
                            if (!catDragging.current || !catScrollRef.current) return
                            e.preventDefault()
                            const x = e.pageX - catScrollRef.current.offsetLeft
                            const walk = (x - catStartX.current) * 1.2
                            catScrollRef.current.scrollLeft = catScrollLeft.current - walk
                        }}
                        style={{
                            display: 'flex',
                            gap: '0.45rem',
                            overflowX: 'auto',
                            paddingBottom: '4px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            cursor: 'grab',
                            userSelect: 'none',
                            flex: 1,
                        }}
                    >
                        {/* Pill: Todos */}
                        <button
                            onClick={() => setSelectedCategory('')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                whiteSpace: 'nowrap',
                                padding: '0.4rem 0.9rem',
                                borderRadius: '999px',
                                border: selectedCategory === '' ? '2px solid #1B3022' : '1.5px solid #dedad2',
                                backgroundColor: selectedCategory === '' ? '#1B3022' : 'white',
                                color: selectedCategory === '' ? 'white' : '#555',
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                boxShadow: selectedCategory === '' ? '0 3px 8px rgba(27,48,34,0.15)' : 'none',
                                flexShrink: 0,
                            }}
                        >
                            <span aria-hidden style={{ fontSize: '0.95rem', lineHeight: 1 }}>📚</span>
                            Todos
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    whiteSpace: 'nowrap',
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: '999px',
                                    border: selectedCategory === cat.value ? '2px solid #1B3022' : '1.5px solid #dedad2',
                                    backgroundColor: selectedCategory === cat.value ? '#1B3022' : 'white',
                                    color: selectedCategory === cat.value ? 'white' : '#555',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    boxShadow: selectedCategory === cat.value ? '0 3px 8px rgba(27,48,34,0.15)' : 'none',
                                    flexShrink: 0,
                                }}
                            >
                                <span aria-hidden style={{ fontSize: '0.95rem', lineHeight: 1 }}>{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sorting bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    marginBottom: '1.25rem',
                    overflowX: 'auto',
                    paddingBottom: '5px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}>
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                        {[
                            { val: 'recent', label: 'Recientes' },
                            { val: 'price_asc', label: 'Menor precio' },
                            { val: 'price_desc', label: 'Mayor precio' },
                            { val: 'alpha', label: 'Nombre A-Z' },
                            { val: 'discount', label: 'Ofertas' },
                        ].map(sortOpt => (
                            <button
                                key={sortOpt.val}
                                onClick={() => setAppliedFilters(prev => ({ ...prev, sortBy: sortOpt.val as any }))}
                                style={{
                                    whiteSpace: 'nowrap',
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: '999px',
                                    border: appliedFilters.sortBy === sortOpt.val ? '2px solid #1B3022' : '1.5px solid #dedad2',
                                    backgroundColor: appliedFilters.sortBy === sortOpt.val ? '#1B3022' : 'white',
                                    color: appliedFilters.sortBy === sortOpt.val ? 'white' : '#555',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    boxShadow: appliedFilters.sortBy === sortOpt.val ? '0 3px 8px rgba(27,48,34,0.15)' : 'none'
                                }}
                            >
                                {sortOpt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div style={{ borderTopColor: '#1B3022' }} className="inline-block w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" />
                        <p style={{ marginTop: '0.75rem', fontFamily: "'Montserrat', sans-serif", color: '#555' }}>Cargando libros...</p>
                    </div>
                ) : books.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <p style={{ fontSize: '3rem' }}>📚</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#555', marginTop: '0.5rem' }}>No hay libros que coincidan con los filtros</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem' }}>
                            {books.map(book => (
                                <Link href={`/books/${book.id}`} key={book.id} className="book-card" style={{
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                }}>
                                    <div style={{ aspectRatio: '7/11', background: '#e8e4d8', overflow: 'hidden' }}>
                                        {book.publish_front_image_url ? (
                                            <img src={book.publish_front_image_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📚</div>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            padding: '0.75rem',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A', fontSize: '0.93rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.15rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {book.title}
                                        </h3>
                                        <p
                                            style={{
                                                color: '#777',
                                                fontSize: '0.76rem',
                                                marginBottom: '0.6rem',
                                                fontFamily: "'Montserrat', sans-serif",
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {book.author}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '0.75rem', marginRight: '0.25rem' }}>
                                                    ${Number(book.original_price).toFixed(0)}
                                                </span>
                                                <span style={{ color: '#1B3022', fontWeight: 700, fontSize: '1rem', fontFamily: "'Montserrat', sans-serif" }}>
                                                    ${Number(book.sale_price).toFixed(0)}
                                                </span>
                                            </div>
                                            {book.extra_discount_percent ? book.extra_discount_percent > 0 && (
                                                <span style={{ backgroundColor: '#A67C00', color: 'white', fontSize: '0.62rem', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                                                    {book.extra_discount_percent}% OFF
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div style={{
                                        marginTop: 'auto',
                                        padding: '0.5rem',
                                    }}>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                addToCart(book);
                                                openCart();
                                            }}
                                            style={{
                                                marginTop: 'auto',
                                                width: '100%',
                                                padding: '0.5rem',
                                                backgroundColor: 'white',
                                                color: '#1B3022',
                                                border: '1.5px solid #1B3022',
                                                borderRadius: '999px',
                                                fontFamily: "'Montserrat', sans-serif",
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1B3022'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#1B3022'; }}
                                        >
                                            Añadir al carrito
                                        </button>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Infinite scroll loader */}
                        <div ref={loaderRef} style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                            {loadingMore && <div style={{ borderTopColor: '#1B3022' }} className="w-7 h-7 border-2 border-gray-200 rounded-full animate-spin" />}
                            {!hasMore && <p style={{ color: '#999', fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem' }}>Has visto todos los libros</p>}
                        </div>
                    </>
                )}
            </main>
        </div >
    )
}
