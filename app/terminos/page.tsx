import React from 'react'

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7',
    creamDark: '#EDE9D8',
    forest: '#1B3022',
    charcoal: '#1A1A1A',
    mid: '#666',
    border: '#ddd9cc',
    white: '#fff',
    gold: '#A67C00',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', serif"

export const metadata = {
    title: 'Términos y Condiciones | LibroLoop',
    description: 'Términos y condiciones de uso de LibroLoop: compra, venta, consignación, envíos, devoluciones y más.',
}

const ARTICLES = [
    {
        n: '1', title: 'Políticas de Compra y Pagos',
        body: (
            <>
                <p>Todos los productos ofrecidos en LibroLoop son ejemplares únicos y están sujetos a disponibilidad. Los precios publicados están en <strong>Pesos Mexicanos (MXN)</strong>.</p>
                <p>La confirmación de la orden en el sitio web genera un <strong>apartado del libro</strong>. El pago deberá completarse posteriormente de forma manual (transferencia electrónica o efectivo a contraentrega), una vez que nuestro equipo se ponga en contacto por WhatsApp para coordinar la entrega.</p>
                <Highlight>LibroLoop se reserva el derecho de cancelar la orden si no se logra establecer contacto o confirmar el pago en un lapso de <strong>48 horas</strong>.</Highlight>
            </>
        ),
    },
    {
        n: '2', title: 'Políticas de Envíos',
        body: (
            <>
                <p>El servicio de entrega opera <strong>exclusivamente dentro de la Ciudad de México (CDMX)</strong>.</p>
                <ul>
                    <li>Costo estándar de envío: <strong>$60.00 MXN</strong>.</li>
                    <li>Envío gratuito en compras que superen el monto mínimo establecido en la plataforma (ejemplo: $499.00 MXN).</li>
                </ul>
                <p>No nos hacemos responsables de retrasos ocasionados por eventos fuera de nuestro control (manifestaciones, desastres naturales, problemas de terceros).</p>
            </>
        ),
    },
    {
        n: '3', title: 'Venta y Consignación de Libros',
        body: (
            <>
                <p>Al subir fotografías de libros en la sección "Vende tus libros", el Usuario Vendedor acepta las siguientes condiciones:</p>
                <ul>
                    <li><strong>Filtro de calidad:</strong> LibroLoop se reserva el derecho de rechazar ejemplares con daños severos, humedad, subrayados excesivos, páginas faltantes, o ediciones mayores a 25 años de antigüedad.</li>
                    <li><strong>Fijación de Precio:</strong> LibroLoop determinará el precio final de venta al público basándose en el valor de mercado.</li>
                </ul>
                <p><strong>Modalidades de Ganancia:</strong></p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '0.75rem 0' }}>
                    <div style={{ backgroundColor: '#EDE9D8', borderRadius: '10px', padding: '0.9rem', fontFamily: SANS, fontSize: '0.82rem' }}>
                        <p style={{ fontWeight: 700, margin: '0 0 0.35rem', color: '#1B3022' }}>📦 Opción 1</p>
                        <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>LibroLoop almacena el libro. El vendedor recibe un porcentaje acordado sobre el precio final de venta.</p>
                    </div>
                    <div style={{ backgroundColor: '#EDE9D8', borderRadius: '10px', padding: '0.9rem', fontFamily: SANS, fontSize: '0.82rem' }}>
                        <p style={{ fontWeight: 700, margin: '0 0 0.35rem', color: '#1B3022' }}>🏡 Opción 2</p>
                        <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>El vendedor custodia el libro. Recibe un porcentaje distinto al de la Opción 1.</p>
                    </div>
                </div>
                <Highlight>Al aceptar la propuesta, el vendedor otorga a LibroLoop la <strong>exclusividad de venta por 24 meses</strong>. Si el libro no se vende en este lapso, el vendedor podrá solicitar renovación por otros 24 meses (si el ejemplar sigue cumpliendo las condiciones) o la devolución del mismo.</Highlight>
            </>
        ),
    },
    {
        n: '4', title: 'Políticas de Devolución',
        body: (
            <>
                <p>Aceptamos devoluciones bajo las siguientes condiciones:</p>
                <ul>
                    <li>La solicitud debe realizarse dentro de los <strong>5 días naturales</strong> posteriores a la recepción del producto.</li>
                    <li>El producto debe estar en las mismas condiciones en que fue fotografiado y enviado por LibroLoop.</li>
                    <li>Procederá una devolución total (incluyendo envío) si el libro recibido no corresponde a la descripción, llega con daños estructurales no reportados, o resulta ser una copia no autorizada.</li>
                </ul>
                <p><strong>Proceso:</strong></p>
                <ol>
                    <li>Contactar a LibroLoop por <a href="mailto:equipo@libroloop.com.mx" style={{ color: C.forest }}>equipo@libroloop.com.mx</a> o WhatsApp, adjuntando evidencia fotográfica.</li>
                    <li>Evaluaremos la solicitud en <strong>2 días hábiles</strong>.</li>
                    <li>De ser aprobada, proporcionaremos instrucciones para la recolección. El reembolso se procesará por transferencia en <strong>3 a 7 días hábiles</strong> tras recibir el libro.</li>
                </ol>
            </>
        ),
    },
    {
        n: '5', title: 'Limitación de Responsabilidad',
        body: (
            <p>LibroLoop actúa como intermediario en el modelo de consignación. Realizamos una revisión exhaustiva mediante fotografías e inspección física, pero no podemos garantizar la ausencia absoluta de marcas menores de lectura, dada la naturaleza de los libros de segunda mano.</p>
        ),
    },
    {
        n: '6', title: 'Propiedad Intelectual',
        body: (
            <p>Todos los contenidos del sitio web, incluyendo diseño de interfaz, textos y logos, son propiedad de LibroLoop. Queda estrictamente prohibida su reproducción total o parcial sin autorización.</p>
        ),
    },
    {
        n: '7', title: 'Modificaciones',
        body: (
            <p>LibroLoop se reserva el derecho de modificar estos términos en cualquier momento. El uso continuo de nuestros servicios implica la aceptación de dichas modificaciones.</p>
        ),
    },
    {
        n: '8', title: 'Contacto',
        body: (
            <p>Para cualquier duda o aclaración, escríbenos a <a href="mailto:equipo@libroloop.com.mx" style={{ color: C.forest, fontWeight: 600 }}>equipo@libroloop.com.mx</a>.</p>
        ),
    },
]

export default function TerminosPage() {
    return (
        <div style={{ backgroundColor: C.cream, minHeight: '100vh', fontFamily: SANS }}>

            {/* ── Hero ── */}
            <div style={{ backgroundColor: C.forest, padding: 'clamp(2rem,6vw,4rem) clamp(1rem,5vw,3rem) 2rem' }}>
                <p style={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(245,242,231,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem' }}>
                    LibroLoop · Legal
                </p>
                <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: C.cream, margin: '0 0 0.5rem', lineHeight: 1.2 }}>
                    Términos y Condiciones de Uso
                </h1>
                <p style={{ fontFamily: SANS, fontSize: '0.8rem', color: 'rgba(245,242,231,0.55)', margin: 0 }}>
                    Bienvenido a LibroLoop, la plataforma especializada en compra, venta y consignación de libros de segunda mano.
                    Al acceder o comprar en nuestro sitio, aceptas los términos descritos a continuación.
                </p>
            </div>

            {/* ── Table of contents + content ── */}
            <div style={{ maxWidth: '780px', margin: '0 auto', padding: 'clamp(2rem,5vw,3.5rem) clamp(1rem,4vw,2rem)' }}>

                {/* TOC */}
                <nav style={{ backgroundColor: C.creamDark, borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '2.5rem' }}>
                    <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.72rem', color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.65rem' }}>Contenido</p>
                    <ol style={{ margin: 0, padding: '0 0 0 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {ARTICLES.map(a => (
                            <li key={a.n}>
                                <a href={`#art-${a.n}`} style={{ fontFamily: SANS, fontSize: '0.82rem', color: C.forest, textDecoration: 'none', fontWeight: 500 }}>
                                    {a.n}. {a.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                {/* Articles */}
                {ARTICLES.map(a => (
                    <article key={a.n} id={`art-${a.n}`} style={{ marginBottom: '2.25rem', scrollMarginTop: '80px' }}>
                        <h2 style={{
                            fontFamily: SERIF, fontWeight: 700,
                            fontSize: 'clamp(0.95rem,2.2vw,1.15rem)',
                            color: C.forest, margin: '0 0 0.85rem',
                            paddingBottom: '0.45rem', borderBottom: `2px solid ${C.creamDark}`,
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                            <span style={{ backgroundColor: C.forest, color: C.cream, fontFamily: SANS, fontWeight: 700, fontSize: '0.72rem', minWidth: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {a.n}
                            </span>
                            {a.title}
                        </h2>
                        <div style={{ fontFamily: SANS, fontSize: '0.875rem', color: C.charcoal, lineHeight: 1.8 }}>
                            {a.body}
                        </div>
                    </article>
                ))}

                {/* Footer nav */}
                <div style={{ borderTop: `1.5px solid ${C.border}`, paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontFamily: SANS, fontSize: '0.78rem', color: C.mid }}>
                    <span>© {new Date().getFullYear()} LibroLoop</span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <a href="/privacidad" style={{ color: C.forest }}>Aviso de Privacidad</a>
                        <a href="/" style={{ color: C.forest }}>Volver al Inicio</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Highlight({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            backgroundColor: '#E8F0E9', border: '1.5px solid rgba(27,48,34,0.15)',
            borderRadius: '10px', padding: '0.85rem 1rem',
            margin: '0.85rem 0', fontFamily: SANS, fontSize: '0.82rem',
            color: '#1B3022', lineHeight: 1.7,
        }}>
            {children}
        </div>
    )
}
