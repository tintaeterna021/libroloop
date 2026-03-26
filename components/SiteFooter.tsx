import Link from 'next/link'

export default function SiteFooter() {
    return (
        <footer style={{
            backgroundColor: '#1A1A1A',
            color: '#fff',
            padding: '3rem 1.5rem',
            fontFamily: "'Montserrat', sans-serif"
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '2rem'
            }}>
                {/* Brand */}
                <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{
                        fontFamily: "'Libre Baskerville', serif",
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        margin: '0 0 1rem',
                        color: '#F5F2E7'
                    }}>
                        LibroLoop
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.6, margin: '0 0 1rem', maxWidth: '300px' }}>
                        El marketplace de libros de segunda mano más grande. Encuentra tu próxima lectura o gana dinero con los libros que ya leíste.
                    </p>
                </div>

                {/* Legal Links */}
                <div style={{ flex: '1 1 200px' }}>
                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', margin: '0 0 1rem' }}>
                        Legal
                    </h4>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <li>
                            <Link href="/terminos" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}>
                                Términos y Condiciones
                            </Link>
                        </li>
                        <li>
                            <Link href="/privacidad" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}>
                                Aviso de Privacidad
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Contact Links */}
                <div style={{ flex: '1 1 200px' }}>
                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', margin: '0 0 1rem' }}>
                        Contacto
                    </h4>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <li>
                            <a href="mailto:equipo@libroloop.com.mx" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem' }}>
                                equipo@libroloop.com.mx
                            </a>
                        </li>
                        <li>
                            <a href="mailto:tintaeterna021@gmail.com" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem' }}>
                                Soporte / Datos ARCO
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div style={{
                maxWidth: '1200px',
                margin: '2.5rem auto 0',
                paddingTop: '1.5rem',
                borderTop: '1px solid #333',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#666'
            }}>
                © {new Date().getFullYear()} LibroLoop. Todos los derechos reservados.
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                Hecho por D'cReaM 🐢
            </div>
        </footer>
    )
}
