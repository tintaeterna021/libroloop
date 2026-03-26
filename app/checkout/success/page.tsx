'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
    const params = useSearchParams()
    const orderNumber = params.get('order') ?? 'LL-????'

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#F5F2E7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.25rem',
        }}>
            <div style={{
                maxWidth: '560px',
                width: '100%',
                textAlign: 'center',
            }}>
                {/* Big success icon */}
                <div style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1 }}>🎉</div>

                {/* Headline */}
                <h1 style={{
                    fontFamily: "'Libre Baskerville', 'Playfair Display', serif",
                    fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
                    fontWeight: 700,
                    color: '#1B3022',
                    marginBottom: '0.5rem',
                    lineHeight: 1.2,
                }}>
                    ¡HEMOS RECIBIDO TU ORDEN!
                </h1>

                {/* Order number pill */}
                <div style={{
                    display: 'inline-block',
                    backgroundColor: '#1B3022',
                    color: '#F5F2E7',
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    borderRadius: '999px',
                    padding: '0.55rem 1.5rem',
                    marginBottom: '2rem',
                    letterSpacing: '0.04em',
                }}>
                    #{orderNumber}
                </div>

                {/* Save the number hint */}
                <p style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '0.8rem',
                    color: '#888',
                    marginBottom: '2rem',
                    marginTop: '-1.4rem',
                }}>
                    Guarda este número para cualquier aclaración.
                </p>

                {/* Main message card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '1.75rem 1.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 24px rgba(27,48,34,0.08)',
                    textAlign: 'left',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📱</span>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '0.92rem',
                            color: '#1A1A1A',
                            lineHeight: 1.65,
                            margin: 0,
                        }}>
                            En unos instantes nos pondremos en contacto contigo vía{' '}
                            <strong style={{ color: '#1B3022' }}>WhatsApp</strong> al número que nos
                            proporcionaste para confirmar tu dirección y
                            coordinar la entrega de tus libros.
                        </p>
                    </div>

                    <div style={{
                        borderTop: '1px solid #e8e4d8',
                        paddingTop: '1rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                    }}>
                        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📍</span>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '0.88rem',
                            color: '#555',
                            lineHeight: 1.6,
                            margin: 0,
                        }}>
                            <strong>Nota:</strong> Recuerda que por el momento nuestras entregas son
                            exclusivas en la <strong>CDMX</strong>.
                        </p>
                    </div>
                </div>

                {/* Recycling sign-off */}
                <p style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: '1rem',
                    color: '#1B3022',
                    marginBottom: '2rem',
                    fontStyle: 'italic',
                }}>
                    ¡Gracias por darle una segunda vida a un libro! ♻️📚
                </p>

                {/* Back to catalog CTA */}
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        backgroundColor: '#1B3022',
                        color: 'white',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        borderRadius: '12px',
                        padding: '0.9rem 2.5rem',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s',
                        letterSpacing: '0.02em',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2a4a34')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1B3022')}
                >
                    Seguir Comprando
                </Link>
            </div>
        </div>
    )
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Montserrat', sans-serif", color: '#1B3022' }}>Cargando...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}
