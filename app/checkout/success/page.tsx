'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
    const searchParams = useSearchParams()
    const orderNumber = searchParams.get('order') || '----'

    return (
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>🎉</div>
            <h1 style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: 'clamp(2rem, 8vw, 2.6rem)', 
                color: '#1B3022', 
                marginBottom: '2rem', 
                lineHeight: 1.1,
                fontWeight: 900
            }}>
                ¡HEMOS RECIBIDO TU ORDEN!
            </h1>
            
            <div style={{ marginBottom: '2.5rem' }}>
                <p style={{ 
                    fontFamily: "'Montserrat', sans-serif", 
                    fontSize: '1.2rem', 
                    color: '#1A1A1A', 
                    fontWeight: 700,
                    margin: 0 
                }}>
                    Tu número de pedido es: <span style={{ color: '#1B3022' }}>#LL-{orderNumber}</span>
                </p>
                <p style={{ 
                    fontFamily: "'Montserrat', sans-serif", 
                    fontSize: '0.9rem', 
                    color: '#555', 
                    marginTop: '0.4rem' 
                }}>
                    (Guarda este número para cualquier aclaración)
                </p>
            </div>

            <p style={{ 
                fontFamily: "'Montserrat', sans-serif", 
                fontSize: '1.05rem', 
                color: '#1A1A1A', 
                lineHeight: 1.6, 
                marginBottom: '1.5rem',
                maxWidth: '520px',
                margin: '0 auto 1.5rem'
            }}>
                En unos instantes nos pondremos en contacto contigo vía WhatsApp al número que nos proporcionaste para confirmar tu dirección, acordar el método de pago y coordinar la entrega de tus libros.
            </p>

            <p style={{ 
                fontFamily: "'Montserrat', sans-serif", 
                fontSize: '0.95rem', 
                color: '#1A1A1A', 
                marginBottom: '3rem' 
            }}>
                <strong>Nota:</strong> Recuerda que por el momento nuestras entregas son exclusivas en la CDMX.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                <p style={{ 
                    fontFamily: "'Playfair Display', serif", 
                    fontSize: '1.4rem', 
                    color: '#1B3022', 
                    fontWeight: 700,
                    margin: 0
                }}>
                    ¡Gracias por darle una segunda vida a un libro! ♻️
                </p>
                
                <Link 
                    href="/catalogo"
                    style={{
                        backgroundColor: '#1B3022',
                        color: '#F5F2E7',
                        padding: '1.1rem 2.5rem',
                        borderRadius: '999px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease',
                        display: 'inline-block',
                        boxShadow: '0 4px 12px rgba(27,48,34,0.15)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#2a4a34'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#1B3022'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                >
                    Volver al Catálogo
                </Link>
            </div>
        </div>
    )
}

export default function CheckoutSuccessPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', padding: '4rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Suspense fallback={<div>Cargando...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    )
}
