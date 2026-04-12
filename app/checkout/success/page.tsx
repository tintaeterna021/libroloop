'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
    const searchParams = useSearchParams()
    const orderNumber = searchParams.get('order') || '----'

    return (
        <div style={{ textAlign: 'center', maxWidth: '600px', backgroundColor: 'white', padding: '3rem 2rem', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: '#1B3022', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                ¡HEMOS RECIBIDO TU ORDEN!
            </h1>
            
            <div style={{ backgroundColor: '#F5F2E7', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'inline-block' }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', color: '#555', marginBottom: '0.3rem' }}>Tu número de pedido es:</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#A67C00', margin: 0 }}>
                    #LL-{orderNumber}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', color: '#777', marginTop: '0.3rem' }}>(Guarda este número para cualquier aclaración)</p>
            </div>

            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', color: '#333', lineHeight: 1.6, marginBottom: '2rem' }}>
                En unos instantes nos pondremos en contacto contigo vía WhatsApp al número que nos proporcionaste para confirmar tu dirección, acordar el método de pago y coordinar la entrega de tus libros.
            </p>

            <div style={{ backgroundColor: '#Fef6e0', borderLeft: '4px solid #A67C00', padding: '1rem', borderRadius: '4px', marginBottom: '2.5rem', textAlign: 'left' }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#555', margin: 0 }}>
                    <strong>Nota:</strong> Recuerda que por el momento nuestras entregas son exclusivas en la CDMX.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1B3022', fontWeight: 600 }}>
                    ¡Gracias por darle una segunda vida a un libro! ♻️
                </p>
                <Link 
                    href="/catalogo"
                    style={{
                        backgroundColor: '#1B3022',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '999px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                        marginTop: '1rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
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
