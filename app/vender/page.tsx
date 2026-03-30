'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────
interface BookSlot {
  id: number
  coverPreview: string | null
  backPreview: string | null
}

// ─── Step 1: Quality Filter ──────────────────────────────────
function StepFilter({ onNext }: { onNext: () => void }) {
  const rules = [
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="#1B3022" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 56, height: 56 }}>
          <rect x="8" y="14" width="48" height="42" rx="4" />
          <path d="M8 26h48" />
          <path d="M22 8v12M42 8v12" />
          <text x="32" y="46" textAnchor="middle" fontFamily="Montserrat" fontSize="13" fontWeight="800" stroke="none" fill="#1B3022">25</text>
          <text x="32" y="57" textAnchor="middle" fontFamily="Montserrat" fontSize="7" fontWeight="700" stroke="none" fill="#1B3022">AÑOS</text>
        </svg>
      ),
      text: 'Solo libros de los últimos 25 años (2001 ‹).',
    },
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="#1B3022" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 56, height: 56 }}>
          <rect x="6" y="18" width="36" height="28" rx="4" />
          <circle cx="24" cy="32" r="7" />
          <circle cx="24" cy="32" r="3" />
          <path d="M36 22h10a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H42" />
          <path d="M42 28l4-4" />
        </svg>
      ),
      text: 'Fotos claras: Portada y Contraportada.',
    },
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="#1B3022" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 56, height: 56 }}>
          <rect x="10" y="10" width="44" height="44" rx="4" />
          <path d="M18 24h28M18 32h20M18 40h14" />
          <circle cx="48" cy="48" r="12" fill="#F5F2E7" stroke="#1B3022" strokeWidth="3" />
          <path d="M43 48l3 3 6-6" stroke="#1B3022" strokeWidth="2.5" />
          <line x1="10" y1="10" x2="54" y2="54" stroke="#c0392b" strokeWidth="3" />
        </svg>
      ),
      text: 'Sin subrayados, manchas o páginas sueltas.',
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F2E7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        {/* Logo / Brand */}
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          color: '#1B3022',
          textAlign: 'center',
          fontSize: '1.1rem',
          marginBottom: '0.75rem',
          letterSpacing: '0.5px',
        }}>
          Libro Loop
        </p>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 6vw, 2.8rem)',
          fontWeight: 900,
          color: '#1B3022',
          textAlign: 'center',
          lineHeight: 1.15,
          marginBottom: '2.5rem',
        }}>
          Vende tus libros
        </h1>

        {/* Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '3rem' }}>
          {rules.map((rule, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ flexShrink: 0 }}>{rule.icon}</div>
              <p style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '1rem',
                fontWeight: 500,
                color: '#1A1A1A',
                lineHeight: 1.4,
              }}>
                {rule.text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onNext}
          style={{
            width: '100%',
            padding: '1.1rem',
            backgroundColor: '#1B3022',
            color: '#F5F2E7',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: '1rem',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s, transform 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2a4a34')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1B3022')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ¡Entendido! Empezar
          <span style={{ fontSize: '0.9rem' }}>✦</span>
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Book Upload ─────────────────────────────────────
function PhotoSlot({
  label,
  preview,
  onFile,
}: {
  label: string
  preview: string | null
  onFile: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onFile(url)
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      style={{
        flex: 1,
        aspectRatio: '3/4',
        borderRadius: '12px',
        border: '2px dashed #bbb8ad',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.2s',
        padding: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#1B3022')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#bbb8ad')}
    >
      {preview ? (
        <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <>
          {/* Camera SVG */}
          <svg viewBox="0 0 40 40" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
            <rect x="4" y="12" width="32" height="22" rx="4" />
            <circle cx="20" cy="23" r="6" />
            <path d="M14 12l2.5-4h7L26 12" />
          </svg>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '0.72rem',
            color: '#888',
            fontWeight: 500,
            textAlign: 'center',
            padding: '0 0.5rem',
          }}>
            {label}
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </button>
  )
}

function BookCard({
  book,
  index,
  onCover,
  onBack,
}: {
  book: BookSlot
  index: number
  onCover: (url: string) => void
  onBack: (url: string) => void
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 2px 12px rgba(27,48,34,0.08)',
      marginBottom: '1rem',
    }}>
      <p style={{
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: '0.9rem',
        color: '#1B3022',
        marginBottom: '1rem',
      }}>
        Libro {index + 1}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <PhotoSlot label="Foto Portada" preview={book.coverPreview} onFile={onCover} />
        <PhotoSlot label="Foto Contraportada" preview={book.backPreview} onFile={onBack} />
      </div>
    </div>
  )
}

function StepUpload({ onNext }: { onNext: (books: BookSlot[]) => void }) {
  const [books, setBooks] = useState<BookSlot[]>([
    { id: 1, coverPreview: null, backPreview: null },
  ])

  const addBook = () => {
    setBooks(prev => [...prev, { id: prev.length + 1, coverPreview: null, backPreview: null }])
  }

  const updateCover = (id: number, url: string) =>
    setBooks(prev => prev.map(b => b.id === id ? { ...b, coverPreview: url } : b))

  const updateBack = (id: number, url: string) =>
    setBooks(prev => prev.map(b => b.id === id ? { ...b, backPreview: url } : b))

  const hasAtLeastOne = books.some(b => b.coverPreview || b.backPreview)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', padding: '1.5rem 1rem 8rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          color: '#1B3022',
          textAlign: 'center',
          fontSize: '1.1rem',
          marginBottom: '0.5rem',
        }}>
          Libro Loop
        </p>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
          fontWeight: 900,
          color: '#1B3022',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}>
          Vender mis libros
        </h2>

        {/* Book cards */}
        {books.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            index={i}
            onCover={url => updateCover(book.id, url)}
            onBack={url => updateBack(book.id, url)}
          />
        ))}

        {/* Add another */}
        <button
          onClick={addBook}
          style={{
            width: '100%',
            padding: '0.85rem',
            background: 'white',
            color: '#1B3022',
            border: '2px dashed #1B3022',
            borderRadius: '999px',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            marginBottom: '1rem',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0ede3')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
        >
          + Añadir otro libro
        </button>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        padding: '1rem 1.5rem',
        backgroundColor: '#F5F2E7',
        borderTop: '1px solid #e0ddd2',
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <button
            onClick={() => onNext(books)}
            disabled={!hasAtLeastOne}
            style={{
              width: '100%',
              padding: '1.1rem',
              backgroundColor: hasAtLeastOne ? '#1B3022' : '#ccc',
              color: '#F5F2E7',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '1rem',
              border: 'none',
              borderRadius: '999px',
              cursor: hasAtLeastOne ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
          >
            ¡Casi listo!
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Account Creation ────────────────────────────────
function StepAccount({ bookCount }: { bookCount: number }) {
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ phone: '', email: '', password: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F5F2E7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '2rem',
      }}>
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2rem', fontWeight: 900,
            color: '#1B3022', marginBottom: '0.75rem',
          }}>
            ¡Listo! Recibimos tus libros.
          </h2>
          <p style={{
            fontFamily: "'Montserrat', sans-serif",
            color: '#555', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '360px',
          }}>
            Te daremos respuesta en menos de 24 horas. Nuestro equipo asignará el precio más competitivo para que se vendan rápido.
          </p>
          <Link href="/" style={{
            display: 'inline-block', marginTop: '2rem',
            color: '#1B3022', fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem',
          }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.9rem 1rem',
    border: '1.5px solid #dedad2',
    borderRadius: '10px',
    backgroundColor: '#faf8f2',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.95rem',
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          fontWeight: 900, color: '#1B3022',
          textAlign: 'center', lineHeight: 1.2,
          marginBottom: '0.5rem',
        }}>
          Crea tu cuenta<br />y envía
        </h2>
        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '0.85rem', color: '#666',
          textAlign: 'center', marginBottom: '2rem',
        }}>
          {bookCount} libro{bookCount !== 1 ? 's' : ''} listos para enviar
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Phone with prefix */}
          <div style={{ display: 'flex', gap: '0', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #dedad2', backgroundColor: '#faf8f2' }}>
            <div style={{
              padding: '0.9rem 0.85rem',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#1B3022',
              borderRight: '1.5px solid #dedad2',
              flexShrink: 0,
              userSelect: 'none',
            }}>
              +52
            </div>
            <input
              type="tel"
              placeholder="Teléfono"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              required
              style={{
                flex: 1,
                padding: '0.9rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '0.95rem',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#1B3022')}
            onBlur={e => (e.target.style.borderColor = '#dedad2')}
          />

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              style={{ ...inputStyle, paddingRight: '3rem' }}
              onFocus={e => (e.target.style.borderColor = '#1B3022')}
              onBlur={e => (e.target.style.borderColor = '#dedad2')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem',
                color: '#888', display: 'flex', alignItems: 'center',
              }}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Submit */}
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '1.1rem',
                backgroundColor: '#1B3022',
                color: '#F5F2E7',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.06em',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2a4a34')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1B3022')}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              CREAR CUENTA Y ENVIAR LIBROS
            </button>
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '0.78rem',
              color: '#333333',
              textAlign: 'center',
              marginTop: '0.85rem',
              lineHeight: 1.5,
            }}>
              Te daremos respuesta en menos de 24 horas.<br />
              Nuestro equipo le asignará el precio más competitivo para que se vendan rápido.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page (Orchestrator) ────────────────────────────────
export default function VenderPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [books, setBooks] = useState<BookSlot[]>([])

  if (step === 1) return <StepFilter onNext={() => setStep(2)} />
  if (step === 2) return (
    <StepUpload
      onNext={(b) => {
        setBooks(b)
        setStep(3)
      }}
    />
  )
  return <StepAccount bookCount={books.filter(b => b.coverPreview || b.backPreview).length} />
}
