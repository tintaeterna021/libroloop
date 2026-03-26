'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { Book } from '@/lib/types'
import { addToGuestCart } from '@/lib/cart'
import Link from 'next/link'

export default function BookDetailPage() {
    const params = useParams()
    const [book, setBook] = useState<Book | null>(null)
    const [loading, setLoading] = useState(true)
    const [added, setAdded] = useState(false)

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
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = () => {
        if (!book) return
        addToGuestCart(book.id, 1)
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
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
                    <Link href="/" style={{ color: '#1B3022', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                        ← Volver al catálogo
                    </Link>
                </div>
            </div>
        )
    }

    const originalPrice = book.price * 2

    return (
        /* pb-32 leaves room for the sticky button */
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', paddingBottom: '6rem' }}>

            {/* Back link */}
            <div style={{ padding: '1rem 1rem 0', maxWidth: '900px', margin: '0 auto' }}>
                <Link
                    href="/"
                    style={{ fontFamily: "'Montserrat', sans-serif", color: '#1B3022', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                    ← Volver al catálogo
                </Link>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
                <div className="md:flex gap-10">

                    {/* ── 1. Image gallery (swipe placeholder) ── */}
                    <div style={{ flex: '0 0 340px' }}>
                        <div style={{
                            aspectRatio: '3/4',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            background: '#e0ddd2',
                            boxShadow: '0 4px 24px rgba(27,48,34,0.12)',
                            position: 'relative',
                        }}>
                            {book.image_url ? (
                                <img
                                    src={book.image_url}
                                    alt={book.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                                    📚
                                </div>
                            )}
                        </div>
                        {/* dots indicator (cosmetic) */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '0.75rem' }}>
                            {[0, 1].map(i => (
                                <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i === 0 ? '#1B3022' : '#ccc', display: 'inline-block' }} />
                            ))}
                        </div>
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
                                ${originalPrice.toFixed(0)}
                            </span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", color: '#1B3022', fontSize: '2rem', fontWeight: 800 }}>
                                ${book.price.toFixed(0)}
                            </span>
                            <span style={{ backgroundColor: '#A67C00', color: 'white', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                50% OFF
                            </span>
                        </div>

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
                                { icon: '✨', label: 'Condición', value: book.condition },
                                { icon: '🏷️', label: 'Categoría', value: book.category },
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

            {/* ── 5. Sticky "Añadir al Carrito" button ── */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1rem 1.25rem',
                backgroundColor: 'white',
                borderTop: '1px solid #e0ddd2',
                boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
                zIndex: 100,
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {book.status === 'available' ? (
                        <button
                            onClick={handleAddToCart}
                            className="btn-cart"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '999px',
                                fontSize: '1rem',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: added ? '#A67C00' : '#1B3022',
                                color: 'white',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                transition: 'background-color 0.3s, transform 0.1s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            {added ? '✓ Agregado al Carrito' : '🛒 Añadir al Carrito'}
                        </button>
                    ) : (
                        <div style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '999px',
                            textAlign: 'center',
                            backgroundColor: '#ccc',
                            color: '#888',
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 700,
                        }}>
                            No Disponible
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
