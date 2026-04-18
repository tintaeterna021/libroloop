'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

// ─── Types ───────────────────────────────────────────────────
interface BookSlot {
  id: number
  coverPreview: string | null
  coverFile: File | null
  backPreview: string | null
  backFile: File | null
}

type StepNumber = 1 | 2 | 3

function isBookComplete(book: BookSlot) {
  return !!book.coverPreview && !!book.backPreview
}

function revokeBookPreviews(book: BookSlot) {
  if (book.coverPreview?.startsWith('blob:')) URL.revokeObjectURL(book.coverPreview)
  if (book.backPreview?.startsWith('blob:')) URL.revokeObjectURL(book.backPreview)
}

function Stepper({
  currentStep,
  stepsEnabled,
  onSelectStep,
}: {
  currentStep: StepNumber
  stepsEnabled: Record<StepNumber, boolean>
  onSelectStep: (step: StepNumber) => void
}) {
  const steps: Array<{ step: StepNumber; label: string }> = [
    { step: 1, label: 'Paso 1' },
    { step: 2, label: 'Paso 2' },
    { step: 3, label: 'Paso 3' },
  ]

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto 1.25rem',
        padding: '0 0.25rem',
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}
    >
      {steps.map(({ step, label }) => {
        const isActive = step === currentStep
        const isDone = step < currentStep
        const disabled = step > currentStep || !stepsEnabled[step]

        return (
          <button
            key={step}
            type="button"
            disabled={disabled}
            onClick={() => onSelectStep(step)}
            aria-current={isActive ? 'step' : undefined}
            style={{
              flex: 1,
              padding: '0.5rem 0.4rem',
              borderRadius: '999px',
              border: isActive ? '1.5px solid rgba(255,255,255,0.8)' : '1.5px solid #e0ddd2',
              backgroundColor: isActive ? '#1B3022' : isDone ? 'rgba(27,48,34,0.12)' : 'transparent',
              color: isActive ? '#F5F2E7' : '#1B3022',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.65 : 1,
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              fontSize: '0.78rem',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isDone ? '✓ ' : ''}
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Step 1: Quality Filter ──────────────────────────────────
function StepFilter({
  onNext,
  onSelectStep,
}: {
  onNext: () => void
  onSelectStep: (step: StepNumber) => void
}) {
  const rules = [
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="#1B3022" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 56, height: 56 }}>
          <rect x="8" y="14" width="48" height="45" rx="4" />
          <path d="M8 26h48" />
          <path d="M22 8v12M42 8v12" />
          <text x="32" y="46" textAnchor="middle" fontFamily="Montserrat" fontSize="13" fontWeight="800" stroke="none" fill="#1B3022">2001</text>
        </svg>
      ),
      text: 'Solo libros de los últimos 25 años (+2001).',
    },
    {
      icon: (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="#1B3022"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 56, height: 56 }}
        >

          {/* Cámara */}
          <rect x="16" y="16" width="34" height="24" rx="4" />
          <path d="M26 15l3-4h10l3 4" />
          <circle cx="34" cy="28" r="6" />
          <circle cx="34" cy="28" r="2.5" />
        </svg>
      ),
      text: 'Fotos claras: Portada y Contraportada.',
    },
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="#1B3022" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 56, height: 56 }}>
          <rect x="10" y="10" width="44" height="44" rx="4" />
          <path d="M18 32h20" stroke="#c0392b" />
          <path d="M18 24h28M18 40h14" />
          {/* Mancha roja irregular */}
          <circle cx="22" cy="22" r="5" stroke="#c0392b" />

          {/* Tache roja */}
          <line x1="40" y1="36" x2="48" y2="46" stroke="#c0392b" strokeWidth="3.5" />
          <line x1="40" y1="46" x2="48" y2="36" stroke="#c0392b" strokeWidth="3.5" />
        </svg>
      ),
      text: 'Sin subrayados, manchas o páginas sueltas.',
    },
    {
      icon: (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="#1B3022"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 56, height: 56 }}
        >
          {/* Libro */}
          <rect x="10" y="10" width="44" height="44" rx="4" />
          <path d="M18 24h28M18 32h20M18 40h14" />

          {/* Sello */}
          <path d="M46 36l2.5 1.5 2.9-.4 1.5 2.5 2.5 1.5-.4 2.9 1.5 2.5-1.5 2.5.4 2.9-2.5 1.5-1.5 2.5-2.9-.4-2.5 1.5-2.5-1.5-2.9.4-1.5-2.5-2.5-1.5.4-2.9-1.5-2.5 1.5-2.5-.4-2.9 2.5-1.5 1.5-2.5 2.9.4L46 36z" fill="#F5F2E7" />
          <path d="M42.5 46l2.5 2.5 5-6" />
        </svg>
      ),
      text: 'No libros piratas.',
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
        <Stepper
          currentStep={1}
          stepsEnabled={{ 1: true, 2: true, 3: true }}
          onSelectStep={onSelectStep}
        />
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
  onFile: (url: string, file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrorMsg(`Solo se permite JPG, PNG o WEBP. Formato actual: ${file.type || 'desconocido'}`)
      return
    }

    const maxSizeInBytes = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSizeInBytes) {
      setErrorMsg(`La foto pesa ${(file.size / 1024 / 1024).toFixed(2)} MB. El límite es 10 MB.`)
      return
    }

    setIsCompressing(true)
    try {
      const options = {
        maxSizeMB: 0.35, // Balance moderado (~350KB)
        maxWidthOrHeight: 1200, // Mitad de camino entre 800 y 1600
        useWebWorker: true,
        initialQuality: 0.75 // Calidad intermedia
      }
      
      const compressedBlob = await imageCompression(file, options)
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
      })

      const url = URL.createObjectURL(compressedFile)
      onFile(url, compressedFile)
    } catch (error) {
      console.error('Error al comprimir la imagen:', error)
      setErrorMsg('Error al optimizar la foto. Intenta con otra.')
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%',
          aspectRatio: '3/4',
          borderRadius: '12px',
          border: errorMsg ? '2px dashed #c0392b' : '2px dashed #bbb8ad',
          backgroundColor: errorMsg ? '#fff3f3' : 'white',
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
        onMouseEnter={e => {
          if (!errorMsg) e.currentTarget.style.borderColor = '#1B3022'
        }}
        onMouseLeave={e => {
          if (!errorMsg) e.currentTarget.style.borderColor = '#bbb8ad'
        }}
      >
        {isCompressing ? (
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '0.8rem',
            color: '#1B3022',
            fontWeight: 700,
          }}>
            Comprimiendo...
          </span>
        ) : preview ? (
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            {/* Camera SVG */}
            <svg viewBox="0 0 40 40" fill="none" stroke={errorMsg ? "#c0392b" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
              <rect x="4" y="12" width="32" height="22" rx="4" />
              <circle cx="20" cy="23" r="6" />
              <path d="M14 12l2.5-4h7L26 12" />
            </svg>
            <span style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '0.72rem',
              color: errorMsg ? '#c0392b' : '#888',
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
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </button>
      {errorMsg && (
        <span style={{ color: '#c0392b', fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', textAlign: 'center', lineHeight: 1.3 }}>
          {errorMsg}
        </span>
      )}
    </div>
  )
}

function BookCard({
  book,
  index,
  onCover,
  onBack,
  onRemove,
}: {
  book: BookSlot
  index: number
  onCover: (url: string, file: File) => void
  onBack: (url: string, file: File) => void
  onRemove?: () => void
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 2px 12px rgba(27,48,34,0.08)',
      marginBottom: '1rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: '0.9rem',
          color: '#1B3022',
          margin: 0,
        }}>
          Libro {index + 1}
        </p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              flexShrink: 0,
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              border: '1.5px solid #c0392b',
              background: 'white',
              color: '#c0392b',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '0.72rem',
              cursor: 'pointer',
            }}
          >
            Eliminar
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <PhotoSlot label="Foto Portada" preview={book.coverPreview} onFile={onCover} />
        <PhotoSlot label="Foto Contraportada" preview={book.backPreview} onFile={onBack} />
      </div>
    </div>
  )
}

function StepUpload({
  books,
  setBooks,
  onNext,
  onBack,
  onSelectStep,
}: {
  books: BookSlot[]
  setBooks: React.Dispatch<React.SetStateAction<BookSlot[]>>
  onNext: (books: BookSlot[]) => void
  onBack: () => void
  onSelectStep: (step: StepNumber) => void
}) {
  const lastBook = books[books.length - 1]
  const canAddAnother = !!lastBook && isBookComplete(lastBook)
  const canProceed = books.length >= 1 && books.every(isBookComplete)

  const addBook = () => {
    if (!canAddAnother) return
    setBooks(prev => {
      const nextId = prev.reduce((m, b) => Math.max(m, b.id), 0) + 1
      return [...prev, { id: nextId, coverPreview: null, coverFile: null, backPreview: null, backFile: null }]
    })
  }

  const removeBook = (id: number) => {
    setBooks(prev => {
      if (prev.length <= 1) return prev
      const target = prev.find(b => b.id === id)
      if (target) revokeBookPreviews(target)
      return prev.filter(b => b.id !== id)
    })
  }

  const updateCover = (id: number, url: string, file: File) =>
    setBooks(prev => prev.map(b => b.id === id ? { ...b, coverPreview: url, coverFile: file } : b))

  const updateBack = (id: number, url: string, file: File) =>
    setBooks(prev => prev.map(b => b.id === id ? { ...b, backPreview: url, backFile: file } : b))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', padding: '1.5rem 1rem 1.5rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <Stepper
          currentStep={2}
          stepsEnabled={{ 1: true, 2: true, 3: canProceed }}
          onSelectStep={onSelectStep}
        />

        <button
          type="button"
          onClick={onBack}
          style={{
            marginBottom: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#1B3022',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← Regresar al paso anterior
        </button>

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
            onCover={(url, file) => updateCover(book.id, url, file)}
            onBack={(url, file) => updateBack(book.id, url, file)}
            onRemove={books.length > 1 ? () => removeBook(book.id) : undefined}
          />
        ))}

        {/* Add another */}
        <button
          onClick={addBook}
          disabled={!canAddAnother}
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
            cursor: canAddAnother ? 'pointer' : 'not-allowed',
            marginBottom: '1rem',
            transition: 'background-color 0.2s',
            opacity: canAddAnother ? 1 : 0.6,
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0ede3')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
        >
          + Añadir otro libro
        </button>
      </div>

      {/* Sticky bottom CTA (sin "arrastre" tipo fixed) */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
        padding: '1rem 1.5rem',
        backgroundColor: '#F5F2E7',
        borderTop: '1px solid #e0ddd2',
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <button
            onClick={() => onNext(books)}
            disabled={!canProceed}
            style={{
              width: '100%',
              padding: '1.1rem',
              backgroundColor: canProceed ? '#1B3022' : '#ccc',
              color: '#F5F2E7',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '1rem',
              border: 'none',
              borderRadius: '999px',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
              touchAction: 'manipulation',
            }}
          >
            ¡Casi listo!
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Account Creation / Submit ────────────────────
function StepAccount({
  books,
  onBack,
  onSelectStep,
}: {
  books: BookSlot[]
  onBack: () => void
  onSelectStep: (step: StepNumber) => void
}) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({ phone: '', email: '', password: '' })

  // Guardamos la sesión si existe
  const [sessionUser, setSessionUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionUser(data.session?.user || null)
    })
  }, [])

  const bookCount = books.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    let finalUser = sessionUser

    try {
      if (!finalUser) {
        // 1. Validaciones solo para nuevos
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.email)) {
          setSubmitError('Por favor ingresa un correo electrónico válido.')
          setIsSubmitting(false)
          return
        }

        const cleanPhone = form.phone.replace(/\D/g, '')
        if (cleanPhone.length !== 10) {
          setSubmitError('El número de teléfono debe tener exactamente 10 dígitos.')
          setIsSubmitting(false)
          return
        }

        // 2. Lógica de Auth: Intentar crear cuenta, si ya existe, intentar login.
        let { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })

        if (authError && authError.message.toLowerCase().includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          })
          if (signInError) {
            // Lanzamos un error amigable o redirigimos el original
            if (signInError.message.toLowerCase().includes('invalid login')) {
              throw new Error("La cuenta asociada a este correo ya existe.")
            }
            throw signInError
          }
          authData = signInData
        } else if (authError) {
          throw authError
        }

        finalUser = authData.user
        if (!finalUser) throw new Error("No se pudo obtener el usuario")

        await supabase.from('profiles').upsert({
          id: finalUser.id,
          email: form.email,
          phone: form.phone,
          name: form.email.split('@')[0],
        }, { onConflict: 'id' })
      }

      for (const book of books) {
        if (!book.coverFile || !book.backFile) continue;

        const coverExt = book.coverFile.name.split('.').pop()
        const backExt = book.backFile.name.split('.').pop()
        const coverFilename = `uploads/${finalUser.id}/${book.id}_cover_${Date.now()}.${coverExt}`
        const backFilename = `uploads/${finalUser.id}/${book.id}_back_${Date.now()}.${backExt}`

        const { error: coverError } = await supabase.storage.from('books').upload(coverFilename, book.coverFile, { upsert: true })
        if (coverError) throw coverError

        const { error: backError } = await supabase.storage.from('books').upload(backFilename, book.backFile, { upsert: true })
        if (backError) throw backError

        const { data: coverUrlData } = supabase.storage.from('books').getPublicUrl(coverFilename)
        const { data: backUrlData } = supabase.storage.from('books').getPublicUrl(backFilename)

        const { error: dbError } = await supabase.from('books').insert({
          user_id: finalUser.id,
          original_front_image_url: coverUrlData.publicUrl,
          original_back_image_url: backUrlData.publicUrl,
          status_code: 1,
        })
        if (dbError) throw dbError
      }

      router.push('/vender/success')
    } catch (err: any) {
      console.error(err)
      setSubmitError(err.message || 'Ocurrió un error al procesar tu solicitud.')
    } finally {
      setIsSubmitting(false)
    }
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
        <Stepper
          currentStep={3}
          stepsEnabled={{ 1: true, 2: true, 3: true }}
          onSelectStep={onSelectStep}
        />

        <button
          type="button"
          onClick={onBack}
          style={{
            marginBottom: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#1B3022',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← Regresar al paso anterior
        </button>

        {sessionUser ? (
          <>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              fontWeight: 900, color: '#1B3022',
              textAlign: 'center', lineHeight: 1.2,
              marginBottom: '0.5rem',
            }}>
              Confirmar envío
            </h2>
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '0.85rem', color: '#666',
              textAlign: 'center', marginBottom: '2rem',
            }}>
              Estás a un paso de enviar {bookCount} libro{bookCount !== 1 ? 's' : ''} para revisión.
            </p>
          </>
        ) : (
          <>
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
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {!sessionUser && (
            <>
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
            </>
          )}

          {/* Error Message */}
          {submitError && (
            <div style={{ color: '#c0392b', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', textAlign: 'center', margin: '0.5rem 0' }}>
              {submitError}
            </div>
          )}

          {/* Submit */}
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '1.1rem',
                backgroundColor: isSubmitting ? '#999' : '#1B3022',
                color: '#F5F2E7',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.06em',
                border: 'none',
                borderRadius: '999px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={e => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2a4a34')}
              onMouseLeave={e => !isSubmitting && (e.currentTarget.style.backgroundColor = '#1B3022')}
              onMouseDown={e => !isSubmitting && (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={e => !isSubmitting && (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isSubmitting ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '10px' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  SUBIENDO FOTOS... POR FAVOR NO CIERRES LA PÁGINA.
                </>
              ) : (sessionUser ? 'CONFIRMAR Y ENVIAR LIBROS' : 'CREAR CUENTA Y ENVIAR LIBROS')}
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
  const [step, setStep] = useState<StepNumber>(1)
  const [books, setBooks] = useState<BookSlot[]>([
    { id: 1, coverPreview: null, coverFile: null, backPreview: null, backFile: null },
  ])

  const canProceed = books.length >= 1 && books.every(isBookComplete)
  const stepsEnabled: Record<StepNumber, boolean> = { 1: true, 2: true, 3: canProceed }

  const onSelectStep = (target: StepNumber) => {
    // Solo regresamos a pasos anteriores (no saltar hacia adelante)
    if (target > step) return
    setStep(target)
  }

  if (step === 1) {
    return <StepFilter onNext={() => setStep(2)} onSelectStep={onSelectStep} />
  }

  if (step === 2) {
    return (
      <StepUpload
        books={books}
        setBooks={setBooks}
        onBack={() => setStep(1)}
        onNext={(b) => setStep(3)}
        onSelectStep={onSelectStep}
      />
    )
  }

  return (
    <StepAccount
      books={books}
      onBack={() => setStep(2)}
      onSelectStep={onSelectStep}
    />
  )
}
