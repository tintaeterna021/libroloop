'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
    const pathname = usePathname()

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
                    </div>

                    {/* ── RIGHT: Auth ── */}
                    <div style={{
                        flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center'
                    }}>
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
                    </div>
                </div>
            </div>
        </nav>
    )
}
