'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Book } from '@/lib/types'
import { useCart } from '@/lib/CartContext'
import Link from 'next/link'

const FILTERS = [
    { label: 'Todos', value: '' },
    { label: 'Ficción', value: 'ficcion' },
    { label: 'Desarrollo Personal', value: 'desarrollo-personal' },
    { label: 'Clásicos', value: 'clasicos' },
    { label: 'Recién Llegados', value: '__new' },
    { label: '< $200', value: '__under200' },
]

const PAGE_SIZE = 12

export default function CatalogoPage() {
    const { addAndOpen } = useCart()
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeFilter, setActiveFilter] = useState('')
    const [addedId, setAddedId] = useState<string | null>(null)
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
            let query = supabase.from('books').select('*').eq('status', 'available')

            if (activeFilter === '__new') {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                query = query.gte('created_at', sevenDaysAgo)
            } else if (activeFilter === '__under200') {
                query = query.lte('price', 200)
            } else if (activeFilter) {
                query = query.eq('category', activeFilter)
            }

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`)
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
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
        }
    }, [activeFilter, searchTerm])

    // Fetch on mount and when filters change
    useEffect(() => {
        fetchBooks(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter, searchTerm])

    // Infinite scroll
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect()
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !isFetchingRef.current) {
                fetchBooks(false)
            }
        }, { threshold: 0.1 })
        if (loaderRef.current) observerRef.current.observe(loaderRef.current)
        return () => observerRef.current?.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchBooks])

    const handleAddToCart = (e: React.MouseEvent, bookId: string) => {
        e.preventDefault()
        addAndOpen(bookId)
        setAddedId(bookId)
        setTimeout(() => setAddedId(null), 1500)
    }

    return (
        <div style={{ backgroundColor: '#F5F2E7', minHeight: '100vh' }}>

            {/* Sticky header: search + pills */}
            <div style={{ position: 'sticky', top: '64px', zIndex: 40 }}>

                {/* Search bar */}
                <div style={{ backgroundColor: '#1B3022', padding: '0.85rem 1rem' }}>
                    <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Busca por título, autor o ISBN..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.8rem',
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
                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                    </div>
                </div>

                {/* Filter pills */}
                <div style={{ backgroundColor: '#F5F2E7', borderBottom: '1px solid #e0ddd2', padding: '0.65rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '3px' }}>
                        {FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setActiveFilter(f.value)}
                                className="pill"
                                style={activeFilter === f.value ? { backgroundColor: '#1B3022', color: 'white' } : {}}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Book Grid */}
            <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div style={{ borderTopColor: '#1B3022' }} className="inline-block w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" />
                        <p style={{ marginTop: '0.75rem', fontFamily: "'Montserrat', sans-serif", color: '#555' }}>Cargando libros...</p>
                    </div>
                ) : books.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <p style={{ fontSize: '3rem' }}>📚</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#555', marginTop: '0.5rem' }}>No hay libros disponibles</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem' }}>
                            {books.map(book => (
                                <Link href={`/books/${book.id}`} key={book.id} className="book-card" style={{ textDecoration: 'none', display: 'block' }}>
                                    <div style={{ aspectRatio: '3/4', background: '#e8e4d8', overflow: 'hidden' }}>
                                        {book.image_url ? (
                                            <img src={book.image_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📚</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '0.75rem' }}>
                                        <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A', fontSize: '0.93rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.15rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {book.title}
                                        </h3>
                                        <p style={{ color: '#777', fontSize: '0.76rem', marginBottom: '0.6rem', fontFamily: "'Montserrat', sans-serif" }}>
                                            {book.author}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '0.75rem', marginRight: '0.25rem' }}>
                                                    ${(book.price * 2).toFixed(0)}
                                                </span>
                                                <span style={{ color: '#1B3022', fontWeight: 700, fontSize: '1rem', fontFamily: "'Montserrat', sans-serif" }}>
                                                    ${book.price.toFixed(0)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={e => handleAddToCart(e, book.id)}
                                                title="Añadir al Carrito"
                                                style={{
                                                    backgroundColor: addedId === book.id ? '#A67C00' : '#1B3022',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '0.4rem 0.6rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.95rem',
                                                    transition: 'background-color 0.2s',
                                                }}
                                            >
                                                {addedId === book.id ? '✓' : '🛒'}
                                            </button>
                                        </div>
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
        </div>
    )
}
