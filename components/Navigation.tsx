'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/CartContext'

export default function Navigation() {
    const pathname = usePathname()
    const { cartItems, openCart } = useCart()

    const linkStyle = (href: string) => ({
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '0.875rem',
        fontWeight: 600,
        padding: '0.4rem 0.85rem',
        borderRadius: '8px',
        color: pathname === href ? 'white' : 'rgba(255,255,255,0.72)',
        backgroundColor: pathname === href ? 'rgba(255,255,255,0.15)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
    })

    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        // Chequeo inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session)
        })

        // Escuchar cambios (login, logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <nav style={{
            backgroundColor: '#1B3022',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            position: 'sticky', top: 0, zIndex: 50,
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '64px', gap: '1rem' }}>

                    {/* ── LEFT: Logo ── */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Link href="/" style={{ textDecoration: 'none' }}>
                            <span style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '1.4rem', fontWeight: 900,
                                color: 'white', letterSpacing: '-0.5px',
                            }}>
                                Libroloop
                            </span>
                        </Link>
                    </div>

                    {/* ── CENTER: Nav links ── */}
                    <div style={{
                        display: 'flex', justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        {!isLoggedIn ? (
                            <>
                                <Link href="/catalogo" style={{
                                    ...linkStyle('/catalogo'),
                                    color: (pathname === '/catalogo' || pathname === '/') ? 'white' : 'rgba(255,255,255,0.72)',
                                    backgroundColor: (pathname === '/catalogo' || pathname === '/') ? 'rgba(255,255,255,0.15)' : 'transparent',
                                }}>
                                    Comprar
                                </Link>
                                <Link href="/vender" style={linkStyle('/vender')}>
                                    Vender
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/catalogo" style={{
                                    ...linkStyle('/catalogo'),
                                    color: (pathname === '/catalogo' || pathname === '/') ? 'white' : 'rgba(255,255,255,0.72)',
                                    backgroundColor: (pathname === '/catalogo' || pathname === '/') ? 'rgba(255,255,255,0.15)' : 'transparent',
                                }}>
                                    Catálogo
                                </Link>
                                <Link href="/mis-compras" style={linkStyle('/mis-compras')}>
                                    Mis compras
                                </Link>
                                <Link href="/ventas" style={linkStyle('/ventas')}>
                                    Mis ventas
                                </Link>
                            </>
                        )}
                    </div>

                    {/* ── RIGHT: Auth & Cart ── */}
                    <div style={{
                        flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.25rem'
                    }}>
                        {/* Cart Button */}
                        <button
                            onClick={openCart}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.4rem',
                                color: 'white',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'transform 0.15s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            aria-label="Abrir carrito"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            {cartItems.length > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-8px',
                                    backgroundColor: '#A67C00', /* Ocre/Dorado */
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    fontFamily: "'Montserrat', sans-serif",
                                    borderRadius: '999px',
                                    minWidth: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 4px',
                                }}>
                                    {cartItems.length}
                                </span>
                            )}
                        </button>

                        {!isLoggedIn ? (
                            <Link
                                href="/login"
                                style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    padding: '0.45rem 1.1rem',
                                    borderRadius: '999px',
                                    color: '#1B3022',
                                    backgroundColor: '#F5F2E7',
                                    textDecoration: 'none',
                                    transition: 'transform 0.1s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                Inicio de sesión
                            </Link>
                        ) : (
                            <Link
                                href="/cuenta"
                                style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    padding: '0.45rem 1.1rem',
                                    borderRadius: '999px',
                                    color: '#1B3022',
                                    backgroundColor: '#ebf4ec',
                                    border: '1.5px solid #a8c4af',
                                    textDecoration: 'none',
                                    transition: 'transform 0.1s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                Mi cuenta
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
