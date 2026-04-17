'use client'

import Link from 'next/link'

export default function VenderSuccessPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', padding: '4rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>📚</div>
                <h1 style={{ 
                    fontFamily: "'Playfair Display', serif", 
                    fontSize: 'clamp(2rem, 8vw, 2.6rem)', 
                    color: '#1B3022', 
                    marginBottom: '2rem', 
                    lineHeight: 1.1,
                    fontWeight: 900
                }}>
                    ¡SOLICITUD RECIBIDA!
                </h1>
                
                <p style={{ 
                    fontFamily: "'Montserrat', sans-serif", 
                    fontSize: '1.2rem', 
                    color: '#1A1A1A', 
                    lineHeight: 1.6, 
                    marginBottom: '1.5rem',
                    fontWeight: 500
                }}>
                    Gracias por sumarte a la economía circular con <strong>LibroLoop</strong>. Hemos recibido las fotos de tus libros con éxito.
                </p>

                <p style={{ 
                    fontFamily: "'Montserrat', sans-serif", 
                    fontSize: '1.05rem', 
                    color: '#1A1A1A', 
                    lineHeight: 1.6, 
                    marginBottom: '2rem',
                    maxWidth: '520px',
                    margin: '0 auto 2rem'
                }}>
                    Nuestro equipo de curaduría revisará el estado de tus libros. En breve (máximo 48 hrs) recibirás un mensaje de WhatsApp para informarte sobre la aceptación de tus títulos y agendar la recolección sin costo.
                </p>

                <div style={{ 
                    backgroundColor: 'rgba(27,48,34,0.05)', 
                    padding: '1.5rem', 
                    borderRadius: '16px', 
                    marginBottom: '3rem',
                    border: '1px dashed #1B3022'
                }}>
                    <p style={{ 
                        fontFamily: "'Montserrat', sans-serif", 
                        fontSize: '0.95rem', 
                        color: '#1B3022', 
                        margin: 0,
                        fontWeight: 600
                    }}>
                        💡 Recuerda tener tus libros a la mano y en el estado que se muestra en las fotos.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                    <p style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '1.4rem', 
                        color: '#1B3022', 
                        fontWeight: 700,
                        margin: 0
                    }}>
                        ¡Gracias por darle una segunda vida a tus libros! ♻️
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
                        Ver Catálogo
                    </Link>
                </div>
            </div>
        </div>
    )
}
