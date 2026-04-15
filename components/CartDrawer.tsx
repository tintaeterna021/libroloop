'use client'

import { useCart } from '@/lib/CartContext'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CartDrawer() {
    const { isCartOpen, closeCart, cartItems, removeFromCart } = useCart()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const subtotal = cartItems.reduce((acc, item) => acc + item.sale_price, 0)
    const ahorros = cartItems.reduce((acc, item) => acc + (item.original_price - item.sale_price), 0)
    const itemsCount = cartItems.length
    const faltaParaEnvioGratis = Math.max(0, 499 - subtotal)

    return (
        <>
            {/* Overlay */}
            {isCartOpen && (
                <div
                    onClick={closeCart}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        zIndex: 998,
                        transition: 'opacity 0.3s ease'
                    }}
                />
            )}

            {/* Drawer */}
            <div style={{
                position: 'fixed',
                top: 0, right: 0, bottom: 0,
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#F5F2E7',
                zIndex: 999,
                transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0ddd2', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{
                            fontFamily: "'Libre Baskerville', serif",
                            color: '#1A1A1A',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            margin: 0
                        }}>
                            Tu Carrito ({itemsCount} artículo{itemsCount !== 1 ? 's' : ''})
                        </h2>
                        <button
                            onClick={closeCart}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#1A1A1A'
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Envío Gratis Banner */}
                    <div style={{
                        backgroundColor: '#1B3022',
                        color: 'white',
                        padding: '0.6rem 1rem',
                        borderRadius: '999px',
                        textAlign: 'center',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(27,48,34,0.3)',
                    }}>
                        {faltaParaEnvioGratis > 0
                            ? `¡Te faltan $${faltaParaEnvioGratis.toLocaleString('es-MX')} para envío gratis!`
                            : '¡Felicidades! Tienes envío gratis'}
                    </div>
                </div>

                {/* Body / Items list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                    {itemsCount === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem', color: '#1A1A1A' }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', opacity: 0.6 }}>
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tu carrito está vacío</h3>
                            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', color: '#555', lineHeight: 1.5 }}>
                                ¡Explora nuestro catálogo y encuentra<br />tu próxima gran lectura a mitad de precio!
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    border: '1px solid #e0ddd2',
                                    borderRadius: '12px',
                                    backgroundColor: 'white',
                                    padding: '0.75rem',
                                    gap: '1rem',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    alignItems: 'center'
                                }}>
                                    {/* Image */}
                                    <div style={{ width: '60px', height: '80px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#F5F2E7', flexShrink: 0 }}>
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📚</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.15rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {item.title}
                                        </h4>
                                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', color: '#555', marginBottom: '0.5rem' }}>
                                            {item.author}
                                        </p>
                                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', fontWeight: 800, color: '#1A1A1A' }}>
                                            ${item.sale_price.toLocaleString('es-MX')}
                                        </p>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#999', padding: '0.5rem', alignSelf: 'flex-start', transition: 'color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#e53935'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#999'}
                                        title="Eliminar del carrito"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer fided bottom */}
                <div style={{
                    borderTop: '1px solid #e0ddd2',
                    padding: '1.5rem',
                    backgroundColor: '#F5F2E7',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', color: '#1A1A1A' }}>Subtotal:</span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.15rem', fontWeight: 800, color: '#1A1A1A' }}>
                            ${subtotal.toLocaleString('es-MX')}
                        </span>
                    </div>

                    {ahorros > 0 && (
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#A67C00', marginBottom: '0.5rem' }}>
                            Tu ahorro total hoy: ${ahorros.toLocaleString('es-MX')}
                        </p>
                    )}

                    {itemsCount > 0 ? (
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'center',
                                backgroundColor: '#1B3022',
                                color: 'white',
                                padding: '1rem',
                                borderRadius: '8px',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(27,48,34,0.2)'
                            }}
                        >
                            Ir al Checkout ✨
                        </Link>
                    ) : (
                        <button
                            onClick={closeCart}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'center',
                                backgroundColor: '#1B3022',
                                color: 'white',
                                padding: '1rem',
                                borderRadius: '8px',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                textDecoration: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(27,48,34,0.2)'
                            }}
                        >
                            Seguir Comprando ✨
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
