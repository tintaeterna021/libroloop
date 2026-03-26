'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/CartContext'

const FREE_SHIPPING_THRESHOLD = 499

export default function CartSidebar() {
    const { isOpen, items, closeCart, removeItem } = useCart()
    const overlayRef = useRef<HTMLDivElement>(null)

    // Trap body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    const subtotal = items.reduce((sum, i) => sum + i.book.price, 0)
    const originalTotal = items.reduce((sum, i) => sum + i.book.price * 2, 0)
    const savings = originalTotal - subtotal
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
    const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)

    return (
        <>
            {/* Responsive width injection */}
            <style>{`
                #cart-drawer { max-width: 420px; }
                @media (max-width: 380px) { #cart-drawer { max-width: 100%; } }
            `}</style>
            {/* ── Backdrop ── */}
            <div
                ref={overlayRef}
                onClick={closeCart}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(27,48,34,0.55)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 100,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.35s ease',
                }}
            />

            {/* ── Sliding Panel ── */}
            <aside
                id="cart-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Tu carrito de compras"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    height: '100dvh',
                    width: '100%',
                    backgroundColor: '#F5F2E7',
                    zIndex: 101,
                    display: 'flex',
                    flexDirection: 'column',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
                }}
            >
                {/* ═══════════════ HEADER ═══════════════ */}
                <header style={{
                    padding: '1.25rem 1.25rem 0',
                    backgroundColor: '#F5F2E7',
                    flexShrink: 0,
                }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{
                            fontFamily: "'Libre Baskerville', 'Playfair Display', serif",
                            color: '#1A1A1A',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            margin: 0,
                        }}>
                            Tu Carrito
                            {items.length > 0 && (
                                <span style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontWeight: 500,
                                    fontSize: '0.9rem',
                                    color: '#555',
                                    marginLeft: '0.35rem',
                                }}>
                                    ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})
                                </span>
                            )}
                        </h2>
                        <button
                            onClick={closeCart}
                            aria-label="Cerrar carrito"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#1A1A1A',
                                fontSize: '1.6rem',
                                lineHeight: 1,
                                padding: '0.2rem 0.4rem',
                                borderRadius: '6px',
                                transition: 'background 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.07)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Free shipping progress bar */}
                    <div style={{
                        backgroundColor: remaining === 0 ? 'rgba(27,48,34,0.08)' : 'rgba(166,124,0,0.09)',
                        borderRadius: '10px',
                        padding: '0.65rem 0.9rem',
                        marginBottom: '0.9rem',
                    }}>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '0.78rem',
                            color: remaining === 0 ? '#1B3022' : '#7A5C00',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                        }}>
                            {remaining === 0
                                ? '🎉 ¡Tienes envío gratis!'
                                : `Te faltan $${remaining.toFixed(0)} para envío gratis`}
                        </p>
                        <div style={{
                            height: '6px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(0,0,0,0.12)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${progressPct}%`,
                                borderRadius: '999px',
                                backgroundColor: remaining === 0 ? '#1B3022' : '#A67C00',
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }} />
                </header>

                {/* ═══════════════ BODY — scrollable book list ═══════════════ */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0.75rem 1.25rem',
                }}>
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#888' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
                            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem' }}>
                                Tu carrito está vacío
                            </p>
                            <button
                                onClick={closeCart}
                                style={{
                                    marginTop: '1rem',
                                    backgroundColor: '#1B3022',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '999px',
                                    padding: '0.65rem 1.5rem',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Seguir comprando
                            </button>
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {items.map(({ book_id, book }) => (
                                <li key={book_id} style={{
                                    display: 'flex',
                                    gap: '0.85rem',
                                    alignItems: 'center',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '0.75rem',
                                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                }}>
                                    {/* Thumbnail */}
                                    <Link href={`/books/${book_id}`} onClick={closeCart} style={{ flexShrink: 0 }}>
                                        <div style={{
                                            width: '60px',
                                            height: '80px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            backgroundColor: '#e8e4d8',
                                        }}>
                                            {book.image_url ? (
                                                <img
                                                    src={book.image_url}
                                                    alt={book.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.6rem',
                                                }}>📚</div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Details */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontFamily: "'Playfair Display', serif",
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            color: '#1A1A1A',
                                            margin: '0 0 0.15rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {book.title}
                                        </p>
                                        <p style={{
                                            fontFamily: "'Montserrat', sans-serif",
                                            fontSize: '0.75rem',
                                            color: '#666',
                                            margin: '0 0 0.5rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {book.author}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{
                                                textDecoration: 'line-through',
                                                color: '#bbb',
                                                fontSize: '0.72rem',
                                                fontFamily: "'Montserrat', sans-serif",
                                            }}>
                                                ${(book.price * 2).toFixed(0)}
                                            </span>
                                            <span style={{
                                                color: '#1B3022',
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                fontFamily: "'Montserrat', sans-serif",
                                            }}>
                                                ${book.price.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={() => removeItem(book_id)}
                                        aria-label={`Eliminar ${book.title}`}
                                        title="Eliminar"
                                        style={{
                                            flexShrink: 0,
                                            background: 'none',
                                            border: '1px solid #e0ddd2',
                                            borderRadius: '8px',
                                            padding: '0.4rem',
                                            cursor: 'pointer',
                                            color: '#bbb',
                                            fontSize: '0.9rem',
                                            lineHeight: 1,
                                            transition: 'all 0.15s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.color = '#c0392b'
                                            e.currentTarget.style.borderColor = '#c0392b'
                                            e.currentTarget.style.background = '#fff0ee'
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.color = '#bbb'
                                            e.currentTarget.style.borderColor = '#e0ddd2'
                                            e.currentTarget.style.background = 'none'
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ═══════════════ FOOTER — sticky ═══════════════ */}
                {items.length > 0 && (
                    <footer style={{
                        flexShrink: 0,
                        padding: '1rem 1.25rem 1.25rem',
                        backgroundColor: '#F5F2E7',
                        borderTop: '1px solid rgba(0,0,0,0.1)',
                    }}>
                        {/* Subtotal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', color: '#444' }}>
                                Subtotal
                            </span>
                            <span style={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                color: '#1A1A1A',
                            }}>
                                ${subtotal.toFixed(0)}
                            </span>
                        </div>

                        {/* Savings hook — brand gold */}
                        <div style={{
                            backgroundColor: 'rgba(166,124,0,0.1)',
                            border: '1px solid rgba(166,124,0,0.25)',
                            borderRadius: '8px',
                            padding: '0.55rem 0.8rem',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}>
                            <span style={{ fontSize: '1rem' }}>✨</span>
                            <span style={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#7A5C00',
                            }}>
                                Tu ahorro total hoy: <strong>${savings.toFixed(0)}</strong>
                            </span>
                        </div>

                        {/* Shipping note */}
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '0.72rem',
                            color: '#999',
                            textAlign: 'center',
                            marginBottom: '0.9rem',
                        }}>
                            Los costos de envío se calculan en el siguiente paso.
                        </p>

                        {/* Checkout button */}
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            style={{
                                display: 'block',
                                width: '100%',
                                backgroundColor: '#1B3022',
                                color: 'white',
                                textAlign: 'center',
                                borderRadius: '12px',
                                padding: '1rem',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                fontSize: '1rem',
                                textDecoration: 'none',
                                transition: 'background-color 0.2s',
                                letterSpacing: '0.02em',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2a4a34')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1B3022')}
                        >
                            Ir al Checkout →
                        </Link>
                    </footer>
                )}
            </aside>
        </>
    )
}
