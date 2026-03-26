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
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', serif"

export const metadata = {
    title: 'Aviso de Privacidad | LibroLoop',
    description: 'Aviso de privacidad de LibroLoop conforme a la LFPDPPP. Conoce cómo protegemos y usamos tus datos personales.',
}

export default function PrivacidadPage() {
    return (
        <div style={{ backgroundColor: C.cream, minHeight: '100vh', fontFamily: SANS }}>
            {/* ── Hero ── */}
            <div style={{ backgroundColor: C.forest, padding: 'clamp(2rem,6vw,4rem) clamp(1rem,5vw,3rem) 2rem' }}>
                <p style={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(245,242,231,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem' }}>
                    LibroLoop · Legal
                </p>
                <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: C.cream, margin: '0 0 0.5rem', lineHeight: 1.2 }}>
                    Aviso de Privacidad
                </h1>
                <p style={{ fontFamily: SANS, fontSize: '0.8rem', color: 'rgba(245,242,231,0.55)', margin: 0 }}>
                    Última actualización: 28 de febrero de 2026
                </p>
            </div>

            {/* ── Content ── */}
            <div style={{ maxWidth: '740px', margin: '0 auto', padding: 'clamp(2rem,5vw,3.5rem) clamp(1rem,4vw,2rem)' }}>

                <Callout>
                    <strong>LibroLoop</strong>, con domicilio en Jorge Ruiz Reyes 32, Cipreses, 04830 Coyoacán,
                    CDMX, México, y portal <a href="https://libroloop.com.mx" style={{ color: C.forest }}>libroloop.com.mx</a>,
                    es el responsable del uso y protección de sus datos personales.
                </Callout>

                <Section title="¿Para qué fines utilizaremos sus datos personales?">
                    <p>Los datos personales que recabamos de usted, los utilizaremos para las siguientes finalidades necesarias para el servicio que solicita:</p>
                    <ul>
                        <li>Prestación de los servicios de compraventa y consignación de libros de segunda mano.</li>
                        <li>Envío y entrega de productos adquiridos en nuestra tienda en línea dentro de la CDMX.</li>
                        <li>Comunicación directa y seguimiento de pedidos, recolecciones o pagos a través de WhatsApp y correo electrónico.</li>
                        <li>Gestión de inventario de vendedores, cálculo de comisiones y transferencia de ganancias por libros vendidos.</li>
                    </ul>
                </Section>

                <Section title="¿Qué datos personales utilizaremos?">
                    <p>Para llevar a cabo las finalidades descritas, utilizaremos los siguientes datos personales:</p>
                    <ul>
                        <li>Datos de identificación y contacto: nombre, domicilio, teléfono y correo electrónico.</li>
                    </ul>
                </Section>

                <Section title="Derechos ARCO">
                    <p>
                        Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos
                        y las condiciones del uso que les damos (<strong>Acceso</strong>). Asimismo, es su derecho solicitar
                        la corrección de su información personal (<strong>Rectificación</strong>); que la eliminemos de
                        nuestros registros (<strong>Cancelación</strong>); así como oponerse al uso de sus datos personales
                        para fines específicos (<strong>Oposición</strong>).
                    </p>
                    <p>Para el ejercicio de cualquiera de los derechos ARCO, envíe una petición a <a href="mailto:tintaeterna021@gmail.com" style={{ color: C.forest, fontWeight: 600 }}>tintaeterna021@gmail.com</a> con asunto <strong>«Derechos ARCO»</strong> y lo siguiente:</p>
                    <ol>
                        <li>Nombre completo del titular.</li>
                        <li>Domicilio.</li>
                        <li>Teléfono.</li>
                        <li>Correo electrónico usado en este sitio web.</li>
                        <li>Copia de una identificación oficial adjunta.</li>
                        <li>Descripción del objeto del escrito (Acceso, Rectificación, Cancelación u Oposición).</li>
                    </ol>
                    <InfoRow label="Tiempo de respuesta" value="10 días hábiles" />
                    <InfoRow label="Medio de respuesta" value="Al correo electrónico de donde se envió la petición" />
                </Section>

                <Section title="Tecnologías de rastreo">
                    <p>
                        En nuestra página de internet utilizamos <strong>cookies, web beacons</strong> u otras tecnologías,
                        a través de las cuales es posible monitorear su comportamiento como usuario de internet, así como
                        brindarle un mejor servicio. Los datos que obtenemos son: identificadores, nombre de usuario,
                        contraseñas de sesión y búsquedas realizadas.
                    </p>
                    <p>
                        Estas tecnologías pueden ser deshabilitadas desde el menú de ayuda de su navegador.
                        Tenga en cuenta que desactivarlas puede limitar ciertas funciones personalizadas del sitio.
                    </p>
                </Section>

                <Section title="Cambios a este aviso de privacidad">
                    <p>
                        El presente aviso de privacidad puede sufrir modificaciones derivadas de nuevos requerimientos legales,
                        cambios en nuestros servicios o en nuestro modelo de negocio. Nos comprometemos a mantenerlo actualizado
                        en <a href="https://libroloop.com.mx" style={{ color: C.forest }}>libroloop.com.mx</a>.
                    </p>
                </Section>

                <div style={{ borderTop: `1.5px solid ${C.border}`, marginTop: '2.5rem', paddingTop: '1.25rem', fontFamily: SANS, fontSize: '0.78rem', color: C.mid, textAlign: 'center' }}>
                    © {new Date().getFullYear()} LibroLoop · <a href="/terminos" style={{ color: C.forest }}>Términos y Condiciones</a>
                </div>
            </div>
        </div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
                fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(1rem,2.5vw,1.2rem)',
                color: C.forest, margin: '0 0 0.85rem',
                paddingBottom: '0.45rem', borderBottom: `2px solid ${C.creamDark}`,
            }}>
                {title}
            </h2>
            <div style={{ fontFamily: SANS, fontSize: '0.875rem', color: C.charcoal, lineHeight: 1.8 }}>
                {children}
            </div>
        </section>
    )
}
function Callout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            backgroundColor: C.creamDark, borderLeft: `4px solid ${C.forest}`,
            borderRadius: '0 10px 10px 0', padding: '1rem 1.25rem',
            marginBottom: '2rem', fontFamily: SANS, fontSize: '0.875rem',
            color: C.charcoal, lineHeight: 1.7,
        }}>
            {children}
        </div>
    )
}
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.45rem 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontWeight: 700, color: C.forest, flexShrink: 0, minWidth: '160px' }}>{label}:</span>
            <span style={{ color: C.charcoal }}>{value}</span>
        </div>
    )
}
