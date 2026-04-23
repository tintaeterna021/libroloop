'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { Book } from '@/lib/types'
import Link from 'next/link'
import { useCart } from '@/lib/CartContext'

export default function BookDetailPage() {
    const { addToCart, openCart } = useCart()
    const params = useParams()
    const [book, setBook] = useState<Book | null>(null)
    const [recommendations, setRecommendations] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    type ImageKey = 'publish_front' | 'publish_back' | 'original_front' | 'original_back'
    const [activeImage, setActiveImage] = useState<ImageKey>('publish_front')

    // ── Carousel state ──
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateArrows = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 4)
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }, [])

    useEffect(() => {
        if (recommendations.length === 0) return
        const el = scrollRef.current
        if (!el) return
        const t = setTimeout(updateArrows, 100)
        el.addEventListener('scroll', updateArrows, { passive: true })
        window.addEventListener('resize', updateArrows)
        return () => { clearTimeout(t); el.removeEventListener('scroll', updateArrows); window.removeEventListener('resize', updateArrows) }
    }, [recommendations, updateArrows])

    const scrollCarousel = (dir: 1 | -1) => {
        const el = scrollRef.current
        if (!el) return
        // Each card is 25% on desktop; scroll by 4 cards
        const cardWidth = el.clientWidth / 4
        const isMobile = window.innerWidth < 640
        const step = isMobile ? el.clientWidth : cardWidth * 4
        el.scrollBy({ left: dir * step, behavior: 'smooth' })
    }

    useEffect(() => {
        fetchBook()
    }, [params.id])

    async function fetchBook() {
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', params.id)
                .single()
            if (error) throw error
            setBook(data)
            if (data?.genre) {
                fetchRecommendations(data.id, data.genre)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function fetchRecommendations(currentId: string, genre: string) {
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('genre', genre)
                .eq('status_code', 6)
                .neq('id', currentId)

            if (error) throw error
            setRecommendations(data || [])
        } catch (err) {
            console.warn('Error fetching recommendations:', err)
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTopColor: '#1B3022' }} className="inline-block w-8 h-8 border-2 border-gray-200 rounded-full animate-spin mb-3" />
                    <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#333' }}>Cargando...</p>
                </div>
            </div>
        )
    }

    if (!book) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '3rem' }}>📚</p>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A', fontSize: '1.8rem', margin: '1rem 0' }}>
                        Libro no encontrado
                    </h1>
                    <Link href="/catalogo" style={{ color: '#1B3022', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                        ← Volver al catálogo
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
            @media (max-width: 640px) {
                .book-image-col { width: 80% !important; max-width: 80% !important; flex: none !important; margin: 0 auto !important; }
            }
            .recs-scroll { display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding: 0.25rem 0; }
            .recs-scroll::-webkit-scrollbar { display: none; }
            .recs-card { flex: 0 0 calc(25% - 0.75rem); scroll-snap-align: start; min-width: 0; }
            .recs-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; border: none; background: rgba(27,48,34,0.85); color: white; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: opacity 0.2s, background 0.2s; z-index: 2; }
            .recs-arrow:hover { background: #1B3022; }
            .recs-arrow.hidden { opacity: 0; pointer-events: none; }
            @media (max-width: 640px) {
                .recs-card { flex: 0 0 calc(50% - 0.5rem); }
                .recs-arrow { width: 28px; height: 28px; font-size: 0.85rem; }
            }
        `}</style>
            <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', paddingBottom: '2rem' }}>

                {/* Back link */}
                <div style={{ padding: '1rem 1rem 0', maxWidth: '900px', margin: '0 auto' }}>
                    <Link
                        href="/catalogo"
                        style={{ fontFamily: "'Montserrat', sans-serif", color: '#1B3022', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                        ← Volver al catálogo
                    </Link>
                </div>

                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
                    <div className="md:flex gap-10">

                        {/* ── 1. Image gallery ── */}
                        <div className="book-image-col" style={{ flex: '0 0 340px' }}>
                            {/* Main image */}
                            <div style={{
                                aspectRatio: '7/11',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: '#e0ddd2',
                                boxShadow: '0 4px 24px rgba(27,48,34,0.12)',
                                position: 'relative',
                                marginBottom: '1rem'
                            }}>
                                {(() => {
                                    const urlMap: Record<string, string | null | undefined> = {
                                        publish_front: book.publish_front_image_url,
                                        publish_back: book.publish_back_image_url,
                                        original_front: book.original_front_image_url,
                                        original_back: book.original_back_image_url,
                                    }
                                    const src = urlMap[activeImage]
                                    return src ? (
                                        <img
                                            src={src}
                                            alt={`${book.title} - ${activeImage}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                                            📚
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Thumbnails — only images that exist */}
                            {(() => {
                                const thumbs: { key: string; url: string; label: string }[] = [
                                    { key: 'publish_front', url: book.publish_front_image_url!, label: 'Portada' },
                                    ...(book.publish_back_image_url ? [{ key: 'publish_back', url: book.publish_back_image_url, label: 'Contraportada' }] : []),
                                    { key: 'original_front', url: book.original_front_image_url!, label: 'Original (frente)' },
                                    { key: 'original_back', url: book.original_back_image_url!, label: 'Original (reverso)' },
                                ]
                                return thumbs.length > 1 ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {thumbs.map(t => (
                                            <button
                                                key={t.key}
                                                onClick={() => setActiveImage(t.key as any)}
                                                title={t.label}
                                                style={{
                                                    width: '60px', height: '90px',
                                                    borderRadius: '8px', overflow: 'hidden',
                                                    border: activeImage === t.key ? '2px solid #1B3022' : '2px solid transparent',
                                                    padding: 0, cursor: 'pointer',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <img src={t.url} alt={t.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </button>
                                        ))}
                                    </div>
                                ) : null
                            })()}
                        </div>

                        {/* ── 2. Details block ── */}
                        <div style={{ flex: 1, marginTop: '1.5rem' }} className="md:mt-0">

                            {/* Title */}
                            <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '0.4rem' }}>
                                {book.title}
                            </h1>

                            {/* Author */}
                            <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#666', fontSize: '1rem', marginBottom: '1rem' }}>
                                {book.author}
                            </p>

                            {/* Price */}
                            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                <span style={{ fontFamily: "'Montserrat', sans-serif", textDecoration: 'line-through', color: '#999', fontSize: '1rem' }}>
                                    ${Number(book.original_price).toFixed(0)}
                                </span>
                                <span style={{ fontFamily: "'Montserrat', sans-serif", color: '#1B3022', fontSize: '2rem', fontWeight: 800 }}>
                                    ${Number(book.sale_price).toFixed(0)}
                                </span>
                                {book.extra_discount_percent ? book.extra_discount_percent > 0 && (
                                    <span style={{ backgroundColor: '#A67C00', color: 'white', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                        {book.extra_discount_percent}% OFF
                                    </span>
                                ) : null}
                            </div>

                            {/* Añadir al Carrito (Botón Principal) */}
                            <button
                                onClick={() => {
                                    addToCart(book);
                                    openCart();
                                }}
                                style={{
                                    width: '100%',
                                    marginBottom: '2rem',
                                    padding: '1rem',
                                    backgroundColor: '#1B3022',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '1.05rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(27,48,34,0.15)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Añadir al carrito
                            </button>

                            {/* ── 3. Ficha técnica ── */}
                            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#1A1A1A', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                                    Ficha Técnica
                                </p>
                                {[
                                    { icon: '📅', label: 'Año', value: book.year?.toString() },
                                    { icon: '🏢', label: 'Editorial', value: book.publisher },
                                    { icon: '🔢', label: 'ISBN', value: book.isbn },
                                    { icon: '📖', label: 'Género', value: book.genre },
                                    { icon: '🗣️', label: 'Idioma', value: book.language },
                                    { icon: '📄', label: 'Páginas', value: book.page_count?.toString() },
                                ].filter(r => r.value).map(row => (
                                    <div key={row.label} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem' }}>{row.icon}</span>
                                        <span style={{ fontFamily: "'Montserrat', sans-serif", color: '#666', fontSize: '0.82rem', minWidth: '80px' }}>{row.label}</span>
                                        <span style={{ fontFamily: "'Montserrat', sans-serif", color: '#1A1A1A', fontSize: '0.85rem', fontWeight: 600 }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* ── 4. Sinopsis ── */}
                            {book.description && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#1A1A1A', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                        Sinopsis
                                    </p>
                                    <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#333', lineHeight: 1.7, fontSize: '0.9rem' }}>
                                        {book.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recommendations Carousel */}
                {recommendations.length > 0 && (
                    <div style={{ maxWidth: '1100px', margin: '2rem auto 0', padding: '0 1rem' }}>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#1A1A1A',
                            marginBottom: '1.25rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid #e0ddd2'
                        }}>
                            También te pueden interesar
                        </h2>
                        <div style={{ position: 'relative' }}>
                            <button className={`recs-arrow ${canScrollLeft ? '' : 'hidden'}`} style={{ left: -12 }} onClick={() => scrollCarousel(-1)}>‹</button>
                            <button className={`recs-arrow ${canScrollRight ? '' : 'hidden'}`} style={{ right: -12 }} onClick={() => scrollCarousel(1)}>›</button>
                            <div ref={scrollRef} className="recs-scroll">
                                {recommendations.slice(0, 8).map(rec => (
                                    <Link href={`/books/${rec.id}`} key={rec.id} className="recs-card" style={{
                                        textDecoration: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                    }}>
                                        <div style={{ aspectRatio: '7/11', background: '#e8e4d8', overflow: 'hidden', borderRadius: '8px' }}>
                                            {rec.publish_front_image_url ? (
                                                <img src={rec.publish_front_image_url} alt={rec.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📚</div>
                                            )}
                                        </div>
                                        <div style={{ padding: '0.6rem 0', display: 'flex', flexDirection: 'column' }}>
                                            <h4 style={{
                                                fontFamily: "'Playfair Display', serif",
                                                color: '#1A1A1A',
                                                fontSize: '0.88rem',
                                                fontWeight: 700,
                                                lineHeight: 1.3,
                                                marginBottom: '0.1rem',
                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                            }}>
                                                {rec.title}
                                            </h4>
                                            <p style={{
                                                color: '#777',
                                                fontSize: '0.76rem',
                                                marginBottom: '0.6rem',
                                                fontFamily: "'Montserrat', sans-serif",
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}>
                                                {rec.author}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '0.7rem' }}>
                                                        ${Number(rec.original_price).toFixed(0)}
                                                    </span>
                                                    <span style={{ color: '#1B3022', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Montserrat', sans-serif" }}>
                                                        ${Number(rec.sale_price).toFixed(0)}
                                                    </span>
                                                </div>
                                                {rec.extra_discount_percent ? rec.extra_discount_percent > 0 && (
                                                    <span style={{ backgroundColor: '#A67C00', color: 'white', fontSize: '0.58rem', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", padding: '0.15rem 0.4rem', borderRadius: '999px' }}>
                                                        {rec.extra_discount_percent}% OFF
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
                                                    addToCart(rec);
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
                        </div>
                    </div>
                )}

            </div>
        </>
    )
}
