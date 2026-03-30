'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ backgroundColor: '#F5F2E7', minHeight: '100vh' }}>

      {/* ══════════════════════════════════
          HERO SECTION — full viewport
      ══════════════════════════════════ */}
      <section style={{
        position: 'relative',
        width: '100%',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingBottom: '8rem',
      }}>

        {/* Background photo — full cover */}
        <img
          src="/hero-background.png"
          alt="Mujer con libros"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(27,48,34,0.2) 0%, rgba(27,48,34,0.55) 55%, rgba(27,48,34,0.95) 100%)',
        }} />

        {/* Text content — centered at bottom */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 1.5rem',
          width: '100%',
          maxWidth: '560px',
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            color: 'white',
            fontSize: 'clamp(1.9rem, 5vw, 2.8rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '0.6rem',
            textShadow: '0 2px 12px rgba(0,0,0,0.35)',
          }}>
            Tus libros favoritos a mitad de precio.
          </h1>
          <p style={{
            fontFamily: "'Montserrat', sans-serif",
            color: 'rgba(255,255,255,0.88)',
            fontSize: '1rem',
            marginBottom: '2rem',
            textShadow: '0 1px 6px rgba(0,0,0,0.3)',
          }}>
            Pide en línea y recibe en casa.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/catalogo"
              style={{
                backgroundColor: '#1B3022',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '999px',
                padding: '0.85rem 2rem',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
            >
              Ver Catálogo
            </Link>
            <Link
              href="/vender"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.7)',
                borderRadius: '999px',
                padding: '0.85rem 2rem',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.2s',
              }}
            >
              Quiero vender
            </Link>
          </div>
        </div>
      </section>

      {/* Footer benefits */}
      <section style={{ backgroundColor: '#1B3022', padding: '3rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.7rem', marginBottom: '1.5rem' }}>
          ¿Por qué Libroloop?
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            { icon: '💸', text: 'Hasta 70% de descuento' },
            { icon: '📦', text: 'Envío rápido y seguro' },
            { icon: '♻️', text: 'Economía circular' },
          ].map(item => (
            <div key={item.text} style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{item.icon}</div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
