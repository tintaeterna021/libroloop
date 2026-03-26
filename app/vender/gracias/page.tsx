import Link from 'next/link'

export default function VenderGraciasPage() {
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
            <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>

                {/* Icon */}
                <div style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1 }}>📚</div>

                {/* Headline */}
                <h1 style={{
                    fontFamily: "'Libre Baskerville', 'Playfair Display', serif",
                    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                    fontWeight: 700,
                    color: '#1B3022',
                    marginBottom: '0.5rem',
                    lineHeight: 1.2,
                }}>
                    ¡Recibimos tus libros!
                </h1>
                <p style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '0.9rem',
                    color: '#555',
                    marginBottom: '2rem',
                }}>
                    Tu cuenta ha sido creada exitosamente.
                </p>

                {/* Card */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '18px',
                    padding: '1.75rem 1.5rem',
                    marginBottom: '1.75rem',
                    boxShadow: '0 4px 24px rgba(27,48,34,0.08)',
                    textAlign: 'left',
                }}>
                    {/* WhatsApp note */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>📱</span>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '0.9rem',
                            color: '#1A1A1A',
                            lineHeight: 1.65,
                            margin: 0,
                        }}>
                            En menos de{' '}
                            <strong style={{ color: '#1B3022' }}>24 horas</strong>
                            {' '}nos pondremos en contacto contigo vía{' '}
                            <strong style={{ color: '#1B3022' }}>WhatsApp</strong>{' '}
                            para explicarte cómo enviarnos los libros físicamente.
                        </p>
                    </div>

                    <div style={{ borderTop: '1px solid #e8e4d8', paddingTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>💰</span>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '0.88rem',
                            color: '#555',
                            lineHeight: 1.6,
                            margin: 0,
                        }}>
                            Nuestro equipo le asignará el <strong>precio más competitivo</strong> para que tus
                            libros se vendan rápido.
                        </p>
                    </div>
                </div>

                {/* Recycling note */}
                <p style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: '1rem',
                    color: '#1B3022',
                    fontStyle: 'italic',
                    marginBottom: '2rem',
                }}>
                    ¡Gracias por darle una segunda vida a un libro! ♻️
                </p>

                {/* Back to catalog */}
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        backgroundColor: '#1B3022',
                        color: '#F5F2E7',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        borderRadius: '12px',
                        padding: '0.9rem 2.5rem',
                        textDecoration: 'none',
                    }}
                >
                    Ver Catálogo
                </Link>
            </div>
        </div>
    )
}
