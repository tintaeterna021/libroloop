'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '@/lib/CartContext'

interface UserInfo {
    id: string
    email: string
    isAdmin: boolean
    rawRoles: any
}

export default function Navigation() {
    const [user, setUser] = useState<UserInfo | null>(null)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const router = useRouter()

    const { items: cartItems, openCart } = useCart()
    const cartCount = cartItems.length

    // Re-check auth on every route change
    useEffect(() => {
        checkAuth()
    }, [pathname])

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') checkAuth()
        })
        return () => { subscription.unsubscribe() }
    }, [])

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    async function checkAuth() {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) { setUser(null); return }

            const { data } = await supabase
                .from('profiles').select('*').eq('id', authUser.id).maybeSingle()

            setUser({
                id: authUser.id,
                email: authUser.email || '',
                isAdmin: JSON.stringify(data?.roles || []).includes('admin'),
                rawRoles: data,
            })
        } catch { setUser(null) }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setDropdownOpen(false)
        setMobileOpen(false)
        router.push('/')
    }

    // Logo link: /catalogo if logged in, / if not
    const logoHref = user ? '/catalogo' : '/'

    // Center nav links
    const centerLinks = !user
        ? [
            { href: '/catalogo', label: 'Catálogo' },
            { href: '/vender', label: 'Vender' },
        ]
        : user.isAdmin
            ? [{ href: '/admin', label: 'Panel Admin' }]
            : [
                { href: '/catalogo', label: 'Catálogo' },
                { href: '/vender/nuevo', label: 'Vender' },
            ]

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

    return (
        <>
            {/* TEMPORARY DEBUG BANNER */}
            {user && (
                <div style={{ background: 'red', color: 'white', fontSize: '10px', padding: '2px 10px', zIndex: 99999, position: 'relative' }}>
                    DEBUG ROLES RECIBIDOS DE BD: {JSON.stringify(user.rawRoles)} | IS_ADMIN: {user.isAdmin ? 'TRUE' : 'FALSE'} | EMAIL: {user.email}
                </div>
            )}
            <nav style={{
                backgroundColor: '#1B3022',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                position: 'sticky', top: 0, zIndex: 50,
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '64px', gap: '1rem' }}>

                        {/* ── LEFT: Logo ── */}
                        <Link href={logoHref} style={{ flexShrink: 0, textDecoration: 'none' }}>
                            <span style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '1.4rem', fontWeight: 900,
                                color: 'white', letterSpacing: '-0.5px',
                            }}>
                                Libroloop
                            </span>
                        </Link>

                        {/* ── CENTER: Nav links (desktop) ── */}
                        <div style={{
                            flex: 1, display: 'flex', justifyContent: 'center',
                            gap: '0.25rem',
                        }} className="hidden md:flex">
                            {centerLinks.map(link => (
                                <Link key={link.href} href={link.href} style={linkStyle(link.href)}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className="flex-1 md:hidden" />

                        {/* ── RIGHT: Actions ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

                            {/* Cart icon */}
                            <button
                                onClick={openCart}
                                style={{
                                    position: 'relative', background: 'none', border: 'none',
                                    cursor: 'pointer', padding: '0.5rem', borderRadius: '8px',
                                    color: 'rgba(255,255,255,0.8)',
                                    fontSize: '1.3rem',
                                    transition: 'background 0.15s',
                                    lineHeight: 1,
                                }}
                                title="Carrito"
                            >
                                🛒
                                {cartCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '2px', right: '2px',
                                        backgroundColor: '#A67C00', color: 'white',
                                        fontSize: '0.6rem', fontWeight: 700,
                                        borderRadius: '999px',
                                        minWidth: '16px', height: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 3px',
                                    }}>
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {/* Account dropdown (logged in) or login link */}
                            {user ? (
                                <div ref={dropdownRef} style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setDropdownOpen(o => !o)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            background: dropdownOpen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '999px',
                                            padding: '0.35rem 0.85rem 0.35rem 0.5rem',
                                            cursor: 'pointer',
                                            color: 'white',
                                            fontFamily: "'Montserrat', sans-serif",
                                            fontSize: '0.82rem', fontWeight: 600,
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <span style={{ fontSize: '1.1rem' }}>👤</span>
                                        Cuenta
                                        <span style={{
                                            fontSize: '0.6rem', opacity: 0.7,
                                            transition: 'transform 0.2s',
                                            display: 'inline-block',
                                            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                                        }}>▼</span>
                                    </button>

                                    {dropdownOpen && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                            backgroundColor: '#1a2820',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            borderRadius: '12px',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                            minWidth: '180px',
                                            overflow: 'hidden',
                                            zIndex: 100,
                                        }}>
                                            <div style={{
                                                padding: '0.6rem 1rem',
                                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                                fontFamily: "'Montserrat', sans-serif",
                                                fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)',
                                            }}>
                                                {user.email}
                                            </div>
                                            <Link
                                                href="/mi-cuenta"
                                                onClick={() => setDropdownOpen(false)}
                                                style={{
                                                    display: 'block', padding: '0.75rem 1rem',
                                                    color: 'rgba(255,255,255,0.85)',
                                                    fontFamily: "'Montserrat', sans-serif",
                                                    fontSize: '0.85rem', fontWeight: 500,
                                                    textDecoration: 'none',
                                                    transition: 'background 0.15s',
                                                }}
                                                className="hover:bg-white/10"
                                            >
                                                👤 Mi Cuenta
                                            </Link>
                                            {user.isAdmin && (
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setDropdownOpen(false)}
                                                    style={{
                                                        display: 'block', padding: '0.75rem 1rem',
                                                        color: 'rgba(255,255,255,0.85)',
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: '0.85rem', fontWeight: 500,
                                                        textDecoration: 'none',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    className="hover:bg-white/10"
                                                >
                                                    ⚙️ Panel Admin
                                                </Link>
                                            )}
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                                <button
                                                    onClick={handleLogout}
                                                    style={{
                                                        width: '100%', textAlign: 'left',
                                                        padding: '0.75rem 1rem',
                                                        background: 'none', border: 'none',
                                                        color: '#f87171',
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: '0.85rem', fontWeight: 500,
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    className="hover:bg-red-500/10"
                                                >
                                                    Cerrar Sesión
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '0.85rem', fontWeight: 600,
                                        padding: '0.4rem 1rem',
                                        borderRadius: '999px',
                                        backgroundColor: 'rgba(255,255,255,0.12)',
                                        border: '1px solid rgba(255,255,255,0.22)',
                                        color: 'white',
                                        textDecoration: 'none',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    Iniciar Sesión
                                </Link>
                            )}

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileOpen(o => !o)}
                                className="md:hidden"
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '0.4rem', color: 'white',
                                }}
                            >
                                <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ width: '100%', height: '2px', backgroundColor: 'white', borderRadius: '2px' }} />
                                    <span style={{ width: '100%', height: '2px', backgroundColor: 'white', borderRadius: '2px' }} />
                                    <span style={{ width: '100%', height: '2px', backgroundColor: 'white', borderRadius: '2px' }} />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    {mobileOpen && (
                        <div style={{
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '1rem', paddingTop: '0.75rem',
                            display: 'flex', flexDirection: 'column', gap: '0.25rem',
                        }} className="md:hidden">
                            {centerLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    style={{
                                        padding: '0.7rem 0.85rem',
                                        borderRadius: '8px',
                                        color: pathname === link.href ? 'white' : 'rgba(255,255,255,0.72)',
                                        backgroundColor: pathname === link.href ? 'rgba(255,255,255,0.15)' : 'transparent',
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontWeight: 600, fontSize: '0.9rem',
                                        textDecoration: 'none',
                                    }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {!user && (
                                <>
                                    <Link href="/catalogo" onClick={() => setMobileOpen(false)} style={{ padding: '0.7rem 0.85rem', borderRadius: '8px', color: 'rgba(255,255,255,0.72)', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>Catálogo</Link>
                                    <Link href="/vender" onClick={() => setMobileOpen(false)} style={{ padding: '0.7rem 0.85rem', borderRadius: '8px', color: 'rgba(255,255,255,0.72)', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>Vender</Link>
                                </>
                            )}
                            {user && (
                                <>
                                    <Link href="/mi-cuenta" onClick={() => setMobileOpen(false)} style={{ padding: '0.7rem 0.85rem', borderRadius: '8px', color: 'rgba(255,255,255,0.72)', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>👤 Mi Cuenta</Link>
                                    <button onClick={handleLogout} style={{ textAlign: 'left', padding: '0.7rem 0.85rem', borderRadius: '8px', background: 'none', border: 'none', color: '#f87171', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Cerrar Sesión</button>
                                </>
                            )}
                            {!user && (
                                <Link href="/login" onClick={() => setMobileOpen(false)} style={{ padding: '0.7rem 0.85rem', borderRadius: '8px', color: 'rgba(255,255,255,0.72)', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>🔐 Iniciar Sesión</Link>
                            )}
                        </div>
                    )}
                </div>
            </nav>
        </>
    )
}
