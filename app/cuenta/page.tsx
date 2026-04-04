'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MiCuentaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email || null)
      setLoading(false)
    }
    
    fetchSession()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: '#F5F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif" }}>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F2E7',
      padding: '4rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '2.5rem',
        color: '#1B3022',
        marginBottom: '2rem',
        fontWeight: 900
      }}>
        Mi Perfil
      </h1>

      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        textAlign: 'center'
      }}>
        
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          backgroundColor: '#ebf4ec', color: '#1B3022',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 800, margin: '0 auto 1.5rem',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
        </div>

        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '0.85rem', color: '#666',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          marginBottom: '0.5rem', fontWeight: 600
        }}>
          Cuenta Activa
        </p>

        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '1.2rem', color: '#1A1A1A',
          marginBottom: '2.5rem', fontWeight: 700
        }}>
          {userEmail}
        </p>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: 'transparent',
            color: '#c0392b',
            border: '1.5px solid #c0392b',
            borderRadius: '999px',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#c0392b'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#c0392b'
          }}
        >
          CERRAR SESIÓN
        </button>

      </div>
    </div>
  )
}
