'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
    cream: '#F5F2E7',
    creamDark: '#EDE9D8',
    forest: '#1B3022',
    forestLight: '#2a4a34',
    charcoal: '#1A1A1A',
    darkGray: '#333333',
    midGray: '#666',
    border: '#ddd9cc',
    gold: '#A67C00',
    white: '#fff',
    red: '#c0392b',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', 'Playfair Display', serif"

const CRITERIA = [
    { icon: '📅', title: 'Solo libros de los últimos 25 años', sub: 'Publicados a partir de 2001.' },
    { icon: '📸', title: 'Fotos claras', sub: 'Portada y Contraportada bien iluminadas.' },
    { icon: '✨', title: 'Buen estado', sub: 'Sin subrayados, manchas o páginas sueltas.' },
]

interface BookSlot {
    id: number
    frontFile: File | null
    frontPreview: string | null
    backFile: File | null
    backPreview: string | null
}

function makeBook(id: number): BookSlot {
    return { id, frontFile: null, frontPreview: null, backFile: null, backPreview: null }
}

export default function VenderNuevoPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [step, setStep] = useState<1 | 2>(1)
    const [books, setBooks] = useState<BookSlot[]>([makeBook(1)])
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState('')

    // Redirect guests to the full registration flow
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) router.replace('/vender')
            else setUserId(user.id)
        })
    }, [router])

    const pickPhoto = useCallback(
        (bookId: number, side: 'front' | 'back') =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0]
                if (!file) return
                const preview = URL.createObjectURL(file)
                setBooks(prev =>
                    prev.map(b =>
                        b.id !== bookId ? b :
                            side === 'front'
                                ? { ...b, frontFile: file, frontPreview: preview }
                                : { ...b, backFile: file, backPreview: preview }
                    )
                )
            },
        []
    )

    const addBook = () => setBooks(prev => [...prev, makeBook(prev[prev.length - 1].id + 1)])
    const removeBook = (id: number) => setBooks(prev => prev.filter(b => b.id !== id))

    const allPhotosComplete = books.every(b => b.frontFile && b.backFile)

    const handleSubmit = async () => {
        if (!userId) return
        setSubmitting(true)
        setFormError('')
        try {
            const uploads: Promise<void>[] = []
            books.forEach((book, bIdx) => {
                const uploadFile = async (file: File, side: string) => {
                    const ext = file.name.split('.').pop()
                    const path = `${userId}/${Date.now()}_libro${bIdx + 1}_${side}.${ext}`
                    await supabase.storage.from('seller-submissions').upload(path, file)
                }
                if (book.frontFile) uploads.push(uploadFile(book.frontFile, 'portada'))
                if (book.backFile) uploads.push(uploadFile(book.backFile, 'contraportada'))
            })
            await Promise.allSettled(uploads)
            router.push('/vender/gracias')
        } catch {
            setFormError('Hubo un error al enviar. Intenta de nuevo.')
            setSubmitting(false)
        }
    }

    if (!userId) return null // loading / redirecting

    // Progress steps
    const steps = [
        { n: 1, label: 'Preparación' },
        { n: 2, label: 'Fotos' },
    ]

    return (
        <div style={{ backgroundColor: C.cream, minHeight: '100vh', paddingBottom: '5rem', fontFamily: SANS }}>

            {/* ── Header ── */}
            <div style={{ backgroundColor: C.forest, padding: '2.5rem 1.25rem 2rem', borderBottom: `4px solid ${C.gold}` }}>
                <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                    {/* Progress dots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {steps.map((s, i) => (
                            <>
                                <div key={s.n} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        backgroundColor: step >= s.n ? C.gold : 'rgba(255,255,255,0.2)',
                                        color: step >= s.n ? C.white : 'rgba(255,255,255,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: SANS, fontWeight: 700, fontSize: '0.8rem',
                                    }}>
                                        {step > s.n ? '✓' : s.n}
                                    </div>
                                    <span style={{
                                        fontFamily: SANS, fontSize: '0.75rem', fontWeight: 600,
                                        color: step >= s.n ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                                    }}>{s.label}</span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                                )}
                            </>
                        ))}
                    </div>

                    <h1 style={{ fontFamily: SERIF, color: C.cream, fontSize: 'clamp(1.3rem, 4vw, 1.7rem)', fontWeight: 700, margin: 0 }}>
                        {step === 1 ? 'Antes de empezar' : 'Fotos de tus libros'}
                    </h1>
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ maxWidth: '520px', margin: '0 auto', padding: '2rem 1.25rem' }}>

                {/* ── STEP 1: Quality filter (same as /vender) ── */}
                {step === 1 && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <h2 style={{ fontFamily: SERIF, fontSize: '1.4rem', color: C.forest, textAlign: 'center', marginBottom: '0.5rem' }}>Filtro de Calidad</h2>
                        <p style={{ fontFamily: SANS, fontSize: '0.9rem', color: C.midGray, lineHeight: 1.6, textAlign: 'center', marginBottom: '2.5rem' }}>
                            Para que tus libros se vendan rápido y al mejor precio, asegúrate de cumplir con estos 3 puntos clave:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                            {CRITERIA.map((c, i) => (
                                <div key={i} style={{ backgroundColor: C.white, borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(27,48,34,0.07)', border: `1.5px solid ${C.border}` }}>
                                    <div style={{ fontSize: '2.2rem', flexShrink: 0, width: '56px', height: '56px', backgroundColor: C.creamDark, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {c.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.9rem', color: C.charcoal, margin: '0 0 0.2rem' }}>{c.title}</p>
                                        <p style={{ fontFamily: SANS, fontSize: '0.78rem', color: C.midGray, margin: 0 }}>{c.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            style={{ width: '100%', backgroundColor: C.forest, color: C.cream, fontFamily: SANS, fontWeight: 700, fontSize: '1rem', borderRadius: '14px', padding: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(27,48,34,0.15)' }}
                        >
                            ¡Entendido! Empezar →
                        </button>
                    </div>
                )}

                {/* ── STEP 2: Photos + Submit ── */}
                {step === 2 && (
                    <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                            {books.map((book, idx) => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    index={idx}
                                    onPick={pickPhoto}
                                    onRemove={books.length > 1 ? () => removeBook(book.id) : undefined}
                                />
                            ))}
                        </div>

                        {books.length < 5 && (
                            <button
                                onClick={addBook}
                                style={{
                                    width: '100%', padding: '0.9rem',
                                    border: `2px dashed ${C.border}`, borderRadius: '14px',
                                    backgroundColor: 'transparent', color: C.midGray,
                                    fontFamily: SANS, fontWeight: 600, fontSize: '0.9rem',
                                    cursor: 'pointer', marginBottom: '1.5rem',
                                }}
                            >
                                + Agregar otro libro
                            </button>
                        )}


                        {!allPhotosComplete && (
                            <p style={{ fontFamily: SANS, fontSize: '0.75rem', color: C.midGray, textAlign: 'center', marginBottom: '0.75rem' }}>
                                Sube portada y contraportada de cada libro para continuar.
                            </p>
                        )}

                        {formError && (
                            <div style={{ backgroundColor: '#fff0ee', border: `1px solid ${C.red}`, borderRadius: '10px', padding: '0.75rem 1rem', fontFamily: SANS, fontSize: '0.83rem', color: C.red, marginBottom: '1rem' }}>
                                {formError}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!allPhotosComplete || submitting}
                            style={{
                                width: '100%', padding: '1.15rem',
                                backgroundColor: (!allPhotosComplete || submitting) ? '#ccc' : C.forest,
                                color: C.cream, border: 'none', borderRadius: '14px',
                                fontFamily: SANS, fontWeight: 700, fontSize: '1rem',
                                cursor: (!allPhotosComplete || submitting) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: allPhotosComplete ? '0 8px 24px rgba(27,48,34,0.15)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            {submitting ? (
                                <>
                                    <span style={{ width: '16px', height: '16px', border: '2.5px solid rgba(245,242,231,0.3)', borderTopColor: C.cream, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Enviando…
                                </>
                            ) : 'Enviar mis libros ✓'}
                        </button>

                        <p style={{ fontFamily: SANS, fontSize: '0.75rem', color: C.darkGray, textAlign: 'center', lineHeight: 1.6, marginTop: '0.85rem' }}>
                            Te daremos respuesta en menos de 24 horas.
                        </p>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ─── BookCard ─────────────────────────────────────────────────────────────────
function BookCard({ book, index, onPick, onRemove }: {
    book: BookSlot
    index: number
    onPick: (id: number, side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemove?: () => void
}) {
    const frontRef = useRef<HTMLInputElement>(null)
    const backRef = useRef<HTMLInputElement>(null)

    return (
        <div style={{ backgroundColor: C.white, borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1.5px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.1rem', color: C.forest, margin: 0 }}>Libro {index + 1}</h3>
                {onRemove && (
                    <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '0.8rem', fontFamily: SANS, fontWeight: 600, padding: '0.4rem 0.6rem', borderRadius: '8px', backgroundColor: C.creamDark }}>
                        ✕ Quitar
                    </button>
                )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <PhotoSlot label="📷 Portada" preview={book.frontPreview} inputRef={frontRef} onChange={onPick(book.id, 'front')} onClick={() => frontRef.current?.click()} />
                <PhotoSlot label="📷 Contraportada" preview={book.backPreview} inputRef={backRef} onChange={onPick(book.id, 'back')} onClick={() => backRef.current?.click()} />
            </div>
        </div>
    )
}

// ─── PhotoSlot ────────────────────────────────────────────────────────────────
function PhotoSlot({ label, preview, inputRef, onChange, onClick }: {
    label: string
    preview: string | null
    inputRef: React.RefObject<HTMLInputElement | null>
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClick: () => void
}) {
    return (
        <div>
            <input ref={inputRef} type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
            <button type="button" onClick={onClick} style={{ width: '100%', aspectRatio: '3/4', borderRadius: '12px', border: `2px dashed ${preview ? C.forest : C.border}`, backgroundColor: preview ? 'transparent' : C.creamDark, cursor: 'pointer', overflow: 'hidden', position: 'relative', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.4rem' }}>
                {preview ? (
                    <>
                        <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(27,48,34,0.75)', fontFamily: SANS, fontSize: '0.7rem', fontWeight: 600, color: '#fff', textAlign: 'center', padding: '0.4rem' }}>
                            ✓ Toca para cambiar
                        </div>
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '1.8rem' }}>📷</span>
                        <span style={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 600, color: C.midGray, textAlign: 'center', lineHeight: 1.3, padding: '0 0.5rem' }}>{label}</span>
                    </>
                )}
            </button>
        </div>
    )
}
