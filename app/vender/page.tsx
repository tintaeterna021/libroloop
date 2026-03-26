'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Brand tokens ────────────────────────────────────────────────────────────
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
    goldLight: 'rgba(166,124,0,0.1)',
    white: '#fff',
    red: '#c0392b',
}
const SANS = "'Montserrat', sans-serif"
const SERIF = "'Libre Baskerville', 'Playfair Display', serif"

// ─── Quality criteria ─────────────────────────────────────────────────────────
const CRITERIA = [
    {
        icon: '📅',
        title: 'Solo libros de los últimos 25 años',
        sub: 'Publicados a partir de 2001.',
    },
    {
        icon: '📸',
        title: 'Fotos claras',
        sub: 'Portada y Contraportada bien iluminadas.',
    },
    {
        icon: '✨',
        title: 'Buen estado',
        sub: 'Sin subrayados, manchas o páginas sueltas.',
    },
]

// ─── Types ───────────────────────────────────────────────────────────────────
interface BookSlot {
    id: number
    frontFile: File | null
    frontPreview: string | null
    backFile: File | null
    backPreview: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeBook(id: number): BookSlot {
    return { id, frontFile: null, frontPreview: null, backFile: null, backPreview: null }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VenderPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [books, setBooks] = useState<BookSlot[]>([makeBook(1)])

    // Redirect logged-in users to their seller dashboard
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) router.replace('/dashboard/seller')
        })
    }, [router])

    // Step 3 form
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState('')

    // ── Password strength ───────────────────────────────────────────────────
    const pwStrength = (pw: string): { score: number; label: string; color: string } => {
        let score = 0
        if (pw.length >= 8) score++
        if (/[A-Z]/.test(pw)) score++
        if (/[0-9]/.test(pw)) score++
        if (/[^A-Za-z0-9]/.test(pw)) score++
        const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte']
        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1B3022']
        return { score, label: labels[score], color: colors[score] }
    }

    // ── Photo selection ─────────────────────────────────────────────────────
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

    const addBook = () =>
        setBooks(prev => [...prev, makeBook(prev[prev.length - 1].id + 1)])

    const removeBook = (id: number) =>
        setBooks(prev => prev.filter(b => b.id !== id))

    const allPhotosComplete = books.every(b => b.frontFile && b.backFile)

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
            setFormError('Ingresa un correo válido')
            return
        }
        if (phone.replace(/\D/g, '').length < 10) {
            setFormError('Teléfono: mínimo 10 dígitos')
            return
        }
        if (password.length < 8) {
            setFormError('La contraseña debe tener al menos 8 caracteres')
            return
        }
        if (!/[A-Z]/.test(password)) {
            setFormError('La contraseña debe incluir al menos una mayúscula')
            return
        }
        if (!/[0-9]/.test(password)) {
            setFormError('La contraseña debe incluir al menos un número')
            return
        }

        setSubmitting(true)
        try {
            // 1. Create Supabase account
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            })
            if (signUpError) {
                if (signUpError.message.toLowerCase().includes('already') ||
                    signUpError.message.toLowerCase().includes('registered')) {
                    throw new Error('Este correo ya está registrado. ¿Ya tienes cuenta? Inicia sesión.')
                }
                throw signUpError
            }

            // 1b. Explicitly sign in to guarantee session is created
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (signInError) throw signInError

            const userId = signInData.user?.id
            if (!userId) throw new Error('No se pudo crear la cuenta')

            // 2. Update profile with phone + vendedor role via RPC
            const { error: rpcError } = await supabase.rpc('upgrade_to_vendedor', {
                user_phone: `+52${phone.replace(/\D/g, '')}`
            })

            if (rpcError) {
                console.error('Error asignando rol de vendedor:', rpcError)
                // Non-blocking: user is created, role can be fixed later
            }

            // 3. Upload book photos to Supabase Storage (bucket: seller-submissions)
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

            // 4. Force Navigation to detect the new session
            router.refresh()

            // 5. Done
            router.push('/vender/gracias')
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al crear la cuenta'
            setFormError(msg)
            setSubmitting(false)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ backgroundColor: C.cream, minHeight: '100vh', paddingBottom: '5rem', fontFamily: SANS }}>

            {/* ── Progress indicator ── */}
            <div style={{ backgroundColor: C.forest, padding: '3rem 1.25rem 2rem', borderBottom: `4px solid ${C.gold}` }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h1 style={{
                        fontFamily: SERIF,
                        color: C.cream,
                        fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
                        fontWeight: 700,
                        textAlign: 'center',
                        marginBottom: '2rem',
                    }}>
                        Vende tus Libros
                    </h1>

                    {/* Step dots */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '0 2rem' }}>
                        {([1, 2, 3] as const).map((s, i) => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                    backgroundColor: step >= s ? C.gold : 'transparent',
                                    border: `2px solid ${step >= s ? C.gold : 'rgba(245,242,231,0.3)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: SANS, fontSize: '0.9rem', fontWeight: 700,
                                    color: step >= s ? C.forest : 'rgba(245,242,231,0.5)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: step === s ? `0 0 0 4px rgba(166,124,0,0.2)` : 'none',
                                }}>
                                    {step > s ? '✓' : s}
                                </div>
                                {i < 2 && (
                                    <div style={{
                                        flex: 1, height: '2px', margin: '0 0.5rem',
                                        backgroundColor: step > s ? C.gold : 'rgba(245,242,231,0.2)',
                                        transition: 'background-color 0.3s ease',
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '560px', margin: '0 auto', padding: '3rem 1.25rem' }}>

                {/* ══════════════════════════════════════════════════
                    STEP 1 — Quality filter
                ══════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <h2 style={{ fontFamily: SERIF, fontSize: '1.4rem', color: C.forest, textAlign: 'center', marginBottom: '0.5rem' }}>Filtro de Calidad</h2>
                        <p style={{
                            fontFamily: SANS, fontSize: '0.9rem', color: C.midGray, lineHeight: 1.6,
                            textAlign: 'center', marginBottom: '2.5rem',
                        }}>
                            Para que tus libros se vendan rápido y al mejor precio, asegúrate de cumplir con estos 3 puntos clave:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                            {CRITERIA.map((c, i) => (
                                <div key={i} style={{
                                    backgroundColor: C.white,
                                    borderRadius: '16px',
                                    padding: '1.25rem 1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    boxShadow: '0 2px 12px rgba(27,48,34,0.07)',
                                    border: `1.5px solid ${C.border}`,
                                }}>
                                    <div style={{
                                        fontSize: '2.2rem', flexShrink: 0,
                                        width: '56px', height: '56px',
                                        backgroundColor: C.creamDark,
                                        borderRadius: '14px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {c.icon}
                                    </div>
                                    <div>
                                        <p style={{
                                            fontFamily: SANS, fontWeight: 700,
                                            fontSize: '0.9rem', color: C.charcoal,
                                            margin: '0 0 0.2rem',
                                        }}>
                                            {c.title}
                                        </p>
                                        <p style={{
                                            fontFamily: SANS, fontSize: '0.78rem',
                                            color: C.midGray, margin: 0,
                                        }}>
                                            {c.sub}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <PrimaryBtn onClick={() => setStep(2)}>
                            ¡Entendido! Empezar →
                        </PrimaryBtn>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    STEP 2 — Book photo upload
                ══════════════════════════════════════════════════ */}
                {step === 2 && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        {/* Minimalist back */}
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: '0.8rem', fontWeight: 600, color: C.midGray, padding: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            ← Paso anterior
                        </button>
                        <h2 style={{ fontFamily: SERIF, fontSize: '1.4rem', color: C.forest, textAlign: 'center', marginBottom: '0.5rem' }}>Registro de Libros</h2>
                        <p style={{
                            fontFamily: SANS, fontSize: '0.9rem', color: C.midGray, lineHeight: 1.6,
                            textAlign: 'center', marginBottom: '2.5rem',
                        }}>
                            Sube una foto clara de la portada y otra de la contraportada por cada ejemplar. Puedes agregar todos los que quieras vender.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
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

                        {/* Add more books */}
                        <button
                            onClick={addBook}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                borderRadius: '12px',
                                border: `2px dashed ${C.border}`,
                                backgroundColor: 'transparent',
                                fontFamily: SANS,
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                color: C.forest,
                                cursor: 'pointer',
                                marginBottom: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = C.creamDark
                                e.currentTarget.style.borderColor = C.forest
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.borderColor = C.border
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>+</span> Añadir otro libro
                        </button>

                        <PrimaryBtn
                            onClick={() => setStep(3)}
                            disabled={!allPhotosComplete}
                        >
                            ¡Casi listo! Crear mi cuenta →
                        </PrimaryBtn>

                        {!allPhotosComplete && (
                            <p style={{
                                fontFamily: SANS, fontSize: '0.75rem',
                                color: C.midGray, textAlign: 'center', marginTop: '0.5rem',
                            }}>
                                Sube la portada y contraportada de cada libro para continuar.
                            </p>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    STEP 3 — Account creation
                ══════════════════════════════════════════════════ */}
                {step === 3 && (
                    <form onSubmit={handleSubmit} noValidate style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        {/* Minimalist back */}
                        <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: '0.8rem', fontWeight: 600, color: C.midGray, padding: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            ← Paso anterior
                        </button>
                        <h2 style={{ fontFamily: SERIF, fontSize: '1.4rem', color: C.forest, textAlign: 'center', marginBottom: '0.5rem' }}>Crea tu Cuenta</h2>
                        <p style={{
                            fontFamily: SANS, fontSize: '0.9rem', color: C.midGray, lineHeight: 1.6,
                            textAlign: 'center', marginBottom: '2.5rem',
                        }}>
                            Necesitamos tus datos para contactarte con nuestra oferta y transferirte tus ganancias una vez que se vendan.
                        </p>

                        {/* Phone */}
                        <FormField label="Teléfono (WhatsApp)">
                            <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
                                <div style={{
                                    padding: '0.7rem 0.85rem',
                                    backgroundColor: C.creamDark,
                                    fontFamily: SANS, fontWeight: 700,
                                    fontSize: '0.9rem', color: C.charcoal,
                                    flexShrink: 0, display: 'flex',
                                    alignItems: 'center', gap: '0.3rem',
                                    borderRight: `1.5px solid ${C.border}`,
                                    userSelect: 'none',
                                }}>
                                    🇲🇽 +52
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="55 1234 5678"
                                    maxLength={15}
                                    inputMode="numeric"
                                    style={{
                                        flex: 1, padding: '0.7rem 0.85rem',
                                        border: 'none', outline: 'none',
                                        fontFamily: SANS, fontSize: '0.9rem',
                                        color: C.charcoal, backgroundColor: C.white,
                                    }}
                                />
                            </div>
                        </FormField>

                        {/* Email */}
                        <FormField label="Correo Electrónico">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                style={fieldStyle}
                            />
                        </FormField>

                        {/* Password */}
                        <FormField label="Contraseña">
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                                    style={{ ...fieldStyle, paddingRight: '3rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    style={{
                                        position: 'absolute', right: '0.85rem', top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', fontSize: '1.1rem',
                                        lineHeight: 1, color: C.midGray,
                                    }}
                                    tabIndex={-1}
                                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {/* Strength indicator */}
                            {password.length > 0 && (() => {
                                const s = pwStrength(password)
                                return (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '3px', marginBottom: '0.25rem' }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} style={{ height: '4px', flex: 1, borderRadius: '99px', backgroundColor: i <= s.score ? s.color : C.border, transition: 'background-color 0.3s' }} />
                                            ))}
                                        </div>
                                        <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: s.color, margin: 0, fontWeight: 600 }}>{s.label}</p>
                                    </div>
                                )
                            })()}
                        </FormField>
                        {formError && (
                            <div style={{
                                backgroundColor: '#fff0ee', border: `1px solid ${C.red}`,
                                borderRadius: '10px', padding: '0.75rem 1rem',
                                fontFamily: SANS, fontSize: '0.83rem', color: C.red,
                                marginBottom: '1.25rem',
                            }}>
                                {formError}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                backgroundColor: submitting ? C.forestLight : C.forest,
                                color: C.cream,
                                fontFamily: SANS,
                                fontWeight: 700,
                                fontSize: '1rem',
                                letterSpacing: '0.02em',
                                borderRadius: '14px',
                                padding: '1.15rem',
                                border: 'none',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.6rem',
                                marginBottom: '1rem',
                                marginTop: '1rem',
                                boxShadow: '0 8px 24px rgba(27,48,34,0.15)',
                            }}
                        >
                            {submitting ? (
                                <>
                                    <span style={{
                                        width: '16px', height: '16px',
                                        border: '2.5px solid rgba(245,242,231,0.3)',
                                        borderTopColor: C.cream,
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Creando cuenta…
                                </>
                            ) : 'Crear Cuenta y Enviar Libros'}
                        </button>

                        {/* Micro-copy */}
                        <p style={{
                            fontFamily: SANS,
                            fontSize: '0.75rem',
                            color: C.darkGray,
                            textAlign: 'center',
                            lineHeight: 1.6,
                            margin: 0,
                        }}>
                            Te daremos respuesta en menos de 24 horas. Nuestro equipo le asignará
                            el precio más competitivo para que se vendan rápido.
                        </p>

                        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Link href="/login" style={{
                                fontFamily: SANS, fontSize: '0.8rem',
                                color: C.forest, textDecoration: 'underline',
                            }}>
                                ¿Ya tienes cuenta? Inicia sesión
                            </Link>
                        </p>
                    </form>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div >
    )
}

// ─── BookCard sub-component ───────────────────────────────────────────────────
function BookCard({ book, index, onPick, onRemove }: {
    book: BookSlot
    index: number
    onPick: (id: number, side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemove?: () => void
}) {
    const frontRef = useRef<HTMLInputElement>(null)
    const backRef = useRef<HTMLInputElement>(null)

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: `1.5px solid ${C.border}`,
        }}>
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{
                    fontFamily: SERIF, fontWeight: 700, fontSize: '1.1rem',
                    color: C.forest, margin: 0,
                }}>
                    Libro {index + 1}
                </h3>
                {onRemove && (
                    <button
                        onClick={onRemove}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#999', fontSize: '0.8rem', fontFamily: SANS, fontWeight: 600,
                            padding: '0.4rem 0.6rem', borderRadius: '8px',
                            backgroundColor: C.creamDark, transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e0dcca'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.creamDark}
                    >
                        ✕ Quitar
                    </button>
                )}
            </div>

            {/* Photo slots */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <PhotoSlot
                    label="📷 Portada"
                    preview={book.frontPreview}
                    inputRef={frontRef}
                    onChange={onPick(book.id, 'front')}
                    onClick={() => frontRef.current?.click()}
                />
                <PhotoSlot
                    label="📷 Contraportada"
                    preview={book.backPreview}
                    inputRef={backRef}
                    onChange={onPick(book.id, 'back')}
                    onClick={() => backRef.current?.click()}
                />
            </div>
        </div>
    )
}

// ─── PhotoSlot sub-component ─────────────────────────────────────────────────
function PhotoSlot({ label, preview, inputRef, onChange, onClick }: {
    label: string
    preview: string | null
    inputRef: React.RefObject<HTMLInputElement | null>
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClick: () => void
}) {
    return (
        <div>
            {/* Hidden file input — accepts both camera and gallery on mobile */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture={undefined} /* lets user choose camera or gallery natively */
                onChange={onChange}
                style={{ display: 'none' }}
            />
            <button
                type="button"
                onClick={onClick}
                style={{
                    width: '100%',
                    aspectRatio: '3/4',
                    borderRadius: '12px',
                    border: `2px dashed ${preview ? C.forest : C.border}`,
                    backgroundColor: preview ? 'transparent' : C.creamDark,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    transition: 'border-color 0.2s',
                }}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt={label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                        />
                        {/* Re-shoot overlay */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            backgroundColor: 'rgba(27,48,34,0.75)',
                            fontFamily: SANS, fontSize: '0.7rem', fontWeight: 600,
                            color: '#fff', textAlign: 'center', padding: '0.4rem',
                        }}>
                            ✓ Toca para cambiar
                        </div>
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '1.8rem' }}>📷</span>
                        <span style={{
                            fontFamily: SANS, fontSize: '0.72rem', fontWeight: 600,
                            color: C.midGray, textAlign: 'center', lineHeight: 1.3, padding: '0 0.5rem',
                        }}>
                            {label}
                        </span>
                    </>
                )}
            </button>
        </div>
    )
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, disabled }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                width: '100%',
                backgroundColor: disabled ? '#ccc' : C.forest,
                color: C.cream,
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: '1.05rem',
                borderRadius: '14px',
                padding: '1.15rem',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: disabled ? 'none' : '0 8px 24px rgba(27,48,34,0.15)',
            }}
        >
            {children}
        </button>
    )
}

const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: '12px',
    border: `1.5px solid ${C.border}`,
    fontFamily: SANS,
    fontSize: '0.9rem',
    color: C.charcoal,
    backgroundColor: C.white,
    outline: 'none',
    boxSizing: 'border-box',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '1.1rem' }}>
            <label style={{
                display: 'block',
                fontFamily: SANS,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: C.charcoal,
                marginBottom: '0.35rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
            }}>
                {label} <span style={{ color: C.red }}>*</span>
            </label>
            {children}
        </div>
    )
}
