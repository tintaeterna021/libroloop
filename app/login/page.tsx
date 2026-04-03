'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    // Limitaciones
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.')
      return
    }

    if (activeTab === 'signup') {
      const cleanPhone = form.phone.replace(/\D/g, '')
      if (cleanPhone.length !== 10) {
        setErrorMsg('El número de teléfono debe tener exactamente 10 dígitos.')
        return
      }
      if (!form.name.trim()) {
        setErrorMsg('Por favor, ingresa tu nombre completo.')
        return
      }
    }

    setLoading(true)
    setErrorMsg('')

    try {
      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (error) {
          if (error.message.toLowerCase().includes('invalid login')) {
            throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.')
          }
          throw error
        }
        router.push('/catalogo')
      } else {
        // Sign Up
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })
        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered')) {
            throw new Error('Ya existe una cuenta con este correo. Ve a Iniciar Sesión.')
          }
          throw signUpError
        }

        const user = authData.user
        if (user) {
           await supabase.from('profiles').upsert({
             id: user.id,
             email: form.email,
             phone: form.phone,
             name: form.name,
           }, { onConflict: 'id' })
        }
        
        router.push('/catalogo')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar tu solicitud.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.95rem 1.1rem',
    border: '1.5px solid #dedad2',
    borderRadius: '12px',
    backgroundColor: '#faf8f2',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.95rem',
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F2E7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4rem 1.5rem',
    }}>
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '2.5rem' }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2.2rem',
          fontWeight: 900,
          color: '#1B3022',
          letterSpacing: '-0.5px',
        }}>
          Libroloop
        </span>
      </Link>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 8px 40px rgba(27,48,34,0.06)',
        padding: '2.5rem 2rem',
        boxSizing: 'border-box',
      }}>
        {/* TABS */}
        <div style={{
          display: 'flex',
          backgroundColor: '#faf8f2',
          borderRadius: '999px',
          padding: '0.35rem',
          marginBottom: '2.25rem',
          border: '1.5px solid #dedad2',
        }}>
          <button
            type="button"
            onClick={() => { setErrorMsg(''); setActiveTab('login') }}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: activeTab === 'login' ? 'white' : 'transparent',
              color: activeTab === 'login' ? '#1B3022' : '#777',
              boxShadow: activeTab === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setErrorMsg(''); setActiveTab('signup') }}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: activeTab === 'signup' ? 'white' : 'transparent',
              color: activeTab === 'signup' ? '#1B3022' : '#777',
              boxShadow: activeTab === 'signup' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* HEADER TEXT */}
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.9rem',
          fontWeight: 800,
          color: '#1B3022',
          textAlign: 'center',
          marginBottom: '0.5rem',
          lineHeight: 1.2,
        }}>
          {activeTab === 'login' ? '¡Hola otra vez!' : 'Únete a Libroloop'}
        </h2>
        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '0.88rem',
          color: '#666',
          textAlign: 'center',
          marginBottom: '2.5rem',
        }}>
          {activeTab === 'login'
            ? 'Ingresa a tu cuenta para explorar nuestra colección.'
            : 'Tu próxima gran historia te espera.'}
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {activeTab === 'signup' && (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#1B3022')}
                onBlur={e => (e.target.style.borderColor = '#dedad2')}
              />
              <div style={{ display: 'flex', gap: '0', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #dedad2', backgroundColor: '#faf8f2' }}>
                <div style={{
                  padding: '0.95rem 0.9rem',
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
                  placeholder="Teléfono (10 dígitos)"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '0.95rem 1rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '0.95rem',
                    color: '#1A1A1A',
                    outline: 'none',
                  }}
                />
              </div>
            </>
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#1B3022')}
            onBlur={e => (e.target.style.borderColor = '#dedad2')}
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ ...inputStyle, paddingRight: '3.5rem' }}
              onFocus={e => (e.target.style.borderColor = '#1B3022')}
              onBlur={e => (e.target.style.borderColor = '#dedad2')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem',
                color: '#888', display: 'flex', alignItems: 'center',
              }}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {errorMsg && (
            <div style={{ color: '#c0392b', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1.15rem',
              marginTop: '1.2rem',
              backgroundColor: '#1B3022',
              color: '#F5F2E7',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '0.92rem',
              letterSpacing: '0.05em',
              border: 'none',
              borderRadius: '999px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'PROCESANDO...' : (activeTab === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA')}
          </button>
        </form>

      </div>
    </div>
  )
}
