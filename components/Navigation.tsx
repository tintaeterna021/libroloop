'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/CartContext'

export default function Navigation() {
    const pathname = usePathname()
    const { cartItems, openCart } = useCart()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const hamburgerRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session)
        })
        return () => subscription.unsubscribe()
    }, [])

    // Cerrar menú al cambiar de ruta
    useEffect(() => {
        setMenuOpen(false)
    }, [pathname])

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        if (!menuOpen) return
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                menuRef.current && !menuRef.current.contains(target) &&
                hamburgerRef.current && !hamburgerRef.current.contains(target)
            ) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [menuOpen])

    const isActive = (href: string) =>
        href === '/catalogo' ? pathname === '/catalogo' || pathname === '/' : pathname === href

    const desktopLinkStyle = (href: string): React.CSSProperties => ({
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '0.875rem',
        fontWeight: 600,
        padding: '0.4rem 0.85rem',
        borderRadius: '8px',
        color: isActive(href) ? 'white' : 'rgba(255,255,255,0.72)',
        backgroundColor: isActive(href) ? 'rgba(255,255,255,0.15)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
    })

    const mobileLinkStyle = (href: string): React.CSSProperties => ({
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '1rem',
        fontWeight: 600,
        padding: '0.85rem 1.25rem',
        borderRadius: '10px',
        color: isActive(href) ? 'white' : 'rgba(255,255,255,0.78)',
        backgroundColor: isActive(href) ? 'rgba(255,255,255,0.14)' : 'transparent',
        textDecoration: 'none',
        display: 'block',
        transition: 'background 0.15s, color 0.15s',
    })

    const navLinks = !isLoggedIn ? (
        <>
            <Link href="/catalogo" style={desktopLinkStyle('/catalogo')}>Comprar</Link>
            <Link href="/vender"   style={desktopLinkStyle('/vender')}>Vender</Link>
        </>
    ) : (
        <>
            <Link href="/catalogo"   style={desktopLinkStyle('/catalogo')}>Catálogo</Link>
            <Link href="/mis-compras" style={desktopLinkStyle('/mis-compras')}>Mis compras</Link>
            <Link href="/ventas"     style={desktopLinkStyle('/ventas')}>Mis ventas</Link>
        </>
    )

    const mobileNavLinks = !isLoggedIn ? (
        <>
            <Link href="/catalogo" style={mobileLinkStyle('/catalogo')}>Comprar</Link>
            <Link href="/vender"   style={mobileLinkStyle('/vender')}>Vender</Link>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
            <Link href="/login" style={mobileLinkStyle('/login')}>Inicio de sesión</Link>
        </>
    ) : (
        <>
            <Link href="/catalogo"   style={mobileLinkStyle('/catalogo')}>Catálogo</Link>
            <Link href="/mis-compras" style={mobileLinkStyle('/mis-compras')}>Mis compras</Link>
            <Link href="/ventas"     style={mobileLinkStyle('/ventas')}>Mis ventas</Link>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
            <Link href="/cuenta"     style={mobileLinkStyle('/cuenta')}>Mi cuenta</Link>
        </>
    )

    return (
        <>
            <style>{`
                @media (min-width: 641px) { .nav-hamburger { display: none !important; } }
                @media (max-width: 640px)  { .nav-desktop-links { display: none !important; } .nav-desktop-auth { display: none !important; } }
            `}</style>

            <nav style={{
                backgroundColor: '#1B3022',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                position: 'sticky', top: 0, zIndex: 50,
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '64px', gap: '1rem' }}>

                        {/* ── Logo ── */}
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

                        {/* ── Desktop: Nav links center ── */}
                        <div className="nav-desktop-links" style={{
                            display: 'flex', justifyContent: 'center',
                            alignItems: 'center', gap: '0.5rem',
                        }}>
                            {navLinks}
                        </div>

                        {/* ── RIGHT: Cart + Auth (desktop) / Cart + Hamburger (mobile) ── */}
                        <div style={{
                            flex: 1, display: 'flex', justifyContent: 'flex-end',
                            alignItems: 'center', gap: '1rem',
                        }}>
                            {/* Cart — always visible */}
                            <button
                                onClick={openCart}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    padding: '0.4rem', color: 'white', position: 'relative',
                                    display: 'flex', alignItems: 'center', transition: 'transform 0.15s',
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
                                        position: 'absolute', top: '-2px', right: '-8px',
                                        backgroundColor: '#A67C00', color: 'white',
                                        fontSize: '0.65rem', fontWeight: 700,
                                        fontFamily: "'Montserrat', sans-serif",
                                        borderRadius: '999px', minWidth: '18px', height: '18px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 4px',
                                    }}>
                                        {cartItems.length}
                                    </span>
                                )}
                            </button>

                            {/* Desktop Auth */}
                            <div className="nav-desktop-auth">
                                {!isLoggedIn ? (
                                    <Link
                                        href="/login"
                                        style={{
                                            fontFamily: "'Montserrat', sans-serif",
                                            fontSize: '0.85rem', fontWeight: 700,
                                            padding: '0.45rem 1.1rem', borderRadius: '999px',
                                            color: '#1B3022', backgroundColor: '#F5F2E7',
                                            textDecoration: 'none', transition: 'transform 0.1s',
                                            display: 'inline-block',
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
                                            fontSize: '0.85rem', fontWeight: 700,
                                            padding: '0.45rem 1.1rem', borderRadius: '999px',
                                            color: '#1B3022', backgroundColor: '#ebf4ec',
                                            border: '1.5px solid #a8c4af',
                                            textDecoration: 'none', transition: 'transform 0.1s',
                                            display: 'inline-block',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        Mi cuenta
                                    </Link>
                                )}
                            </div>

                            {/* Hamburger — mobile only */}
                            <button
                                ref={hamburgerRef}
                                className="nav-hamburger"
                                onClick={() => setMenuOpen(o => !o)}
                                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: 'white', padding: '0.4rem',
                                    display: 'flex', flexDirection: 'column',
                                    justifyContent: 'center', alignItems: 'center', gap: '5px',
                                    width: '36px', height: '36px',
                                }}
                            >
                                <span style={{
                                    display: 'block', width: '22px', height: '2px',
                                    backgroundColor: 'white', borderRadius: '2px',
                                    transition: 'transform 0.25s, opacity 0.25s',
                                    transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                                }} />
                                <span style={{
                                    display: 'block', width: '22px', height: '2px',
                                    backgroundColor: 'white', borderRadius: '2px',
                                    transition: 'opacity 0.25s',
                                    opacity: menuOpen ? 0 : 1,
                                }} />
                                <span style={{
                                    display: 'block', width: '22px', height: '2px',
                                    backgroundColor: 'white', borderRadius: '2px',
                                    transition: 'transform 0.25s, opacity 0.25s',
                                    transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                                }} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Mobile Dropdown Menu ── */}
                <div
                    ref={menuRef}
                    className="nav-hamburger"
                    style={{
                        overflow: 'hidden',
                        maxHeight: menuOpen ? '400px' : '0',
                        transition: 'max-height 0.3s ease',
                        backgroundColor: '#1B3022',
                        borderTop: menuOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    }}
                >
                    <div style={{
                        padding: '0.75rem 1rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                    }}>
                        {mobileNavLinks}
                    </div>
                </div>
            </nav>
        </>
    )
}
