'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  status_code: number
}

type Address = {
  id: string
  user_id: string
  street: string | null
  external_number: string | null
  internal_number: string | null
  postal_code: string | null
  neighborhood: string | null
  references_comments: string | null
}

type PayoutInfo = {
  id: string
  user_id: string
  bank_name: string | null
  clabe: string | null
  account_holder_name: string | null
  is_active: number
}

export default function MiCuentaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submittingAddress, setSubmittingAddress] = useState(false)
  const [submittingPayout, setSubmittingPayout] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [address, setAddress] = useState<Address | null>(null)
  const [payout, setPayout] = useState<PayoutInfo | null>(null)

  const [addressForm, setAddressForm] = useState({
    street: '',
    external_number: '',
    internal_number: '',
    postal_code: '',
    neighborhood: '',
    references_comments: ''
  })

  const [payoutForm, setPayoutForm] = useState({
    bank_name: '',
    clabe: '',
    account_holder_name: ''
  })

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)

      const [profileRes, addressRes, payoutRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('addresses').select('*').eq('user_id', session.user.id).limit(1).maybeSingle(),
        supabase.from('user_payout_info').select('*').eq('user_id', session.user.id).limit(1).maybeSingle()
      ])

      if (profileRes.data) {
        setProfile(profileRes.data)
        setNameDraft(profileRes.data.name || '')
      }
      if (addressRes.data) setAddress(addressRes.data)
      if (payoutRes.data) setPayout(payoutRes.data)

      setLoading(false)
    }

    fetchUserData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSubmittingAddress(true)

    // Validamos que se envíe la info
    const { data, error } = await supabase.from('addresses').insert({
      user_id: userId,
      ...addressForm
    }).select().single()

    setSubmittingAddress(false)

    if (error) {
      alert('Error al guardar la dirección')
      console.error(error)
    } else {
      setAddress(data)
    }
  }

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSubmittingPayout(true)

    const { data, error } = await supabase.from('user_payout_info').insert({
      user_id: userId,
      ...payoutForm
    }).select().single()

    setSubmittingPayout(false)

    if (error) {
      alert('Error al guardar la información bancaria')
      console.error(error)
    } else {
      setPayout(data)
    }
  }

  const handleUpdateProfile = async () => {
    if (!userId) return
    setUpdatingProfile(true)

    const { error } = await supabase
      .from('profiles')
      .update({ name: nameDraft })
      .eq('id', userId)

    if (error) {
      alert('Error al actualizar el perfil')
      console.error(error)
    } else {
      setProfile(prev => prev ? { ...prev, name: nameDraft } : null)
      // Small visual feedback could go here
    }
    setUpdatingProfile(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: '#F5F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif" }}>Cargando información tu de cuenta...</p>
      </div>
    )
  }

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    marginBottom: '2rem',
    width: '100%'
  }

  const sectionTitleStyle = {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.6rem',
    color: '#1B3022',
    marginBottom: '1.5rem',
    fontWeight: 700
  }

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '1rem',
    backgroundColor: '#fff'
  }

  const labelStyle = {
    display: 'block',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.4rem'
  }

  const submitButtonStyle = {
    backgroundColor: '#1B3022',
    color: 'white',
    padding: '1rem 1.5rem',
    border: 'none',
    borderRadius: '999px',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    fontSize: '1rem',
    transition: 'all 0.2s',
    marginTop: '1rem'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E7', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.8rem', color: '#1B3022', fontWeight: 900, margin: 0 }}>
            Mi Cuenta
          </h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'transparent',
              color: '#c0392b',
              border: '1.5px solid #c0392b',
              borderRadius: '999px',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
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
            Cerrar Sesión
          </button>
        </div>

        {/* --- PERFIL --- */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Información Personal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p style={labelStyle}>Correo Electrónico</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: 0, fontSize: '1rem' }}>{profile?.email || 'No disponible'}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={labelStyle}>Nombre Completo</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  style={{
                    ...inputStyle,
                    marginBottom: 0,
                    flex: 1,
                    backgroundColor: updatingProfile ? '#f9fafb' : '#fff'
                  }}
                  placeholder="Tu nombre completo"
                />
                {(nameDraft !== profile?.name) && (
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updatingProfile}
                    style={{
                      backgroundColor: '#1B3022',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 1.25rem',
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: updatingProfile ? 0.7 : 1
                    }}
                  >
                    {updatingProfile ? '...' : 'Guardar'}
                  </button>
                )}
              </div>
            </div>
            <div>
              <p style={labelStyle}>Teléfono</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: 0, fontSize: '1rem' }}>{profile?.phone || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* --- DIRECCIÓN --- */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Dirección de Recolección/Envío</h2>
          {address ? (
            <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                <strong>Calle:</strong> {address.street} {address.external_number} {address.internal_number ? `Int. ${address.internal_number}` : ''}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                <strong>Colonia:</strong> {address.neighborhood}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                <strong>Código Postal:</strong> {address.postal_code}
              </p>
              {address.references_comments && (
                <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: 0, lineHeight: 1.5 }}>
                  <strong>Referencias:</strong> {address.references_comments}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddressSubmit}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.95rem', color: '#4b5563', marginBottom: '1.5rem' }}>
                Agrega tu dirección para poder enviar o recolectar tus libros. Revisa bien la información, no podrás cambiarla después.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0 1.25rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Calle</label>
                  <input required placeholder="Ej. Av. Insurgentes Sur" type="text" style={inputStyle} value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Número Exterior</label>
                  <input required placeholder="Ej. 105" type="text" style={inputStyle} value={addressForm.external_number} onChange={e => setAddressForm({ ...addressForm, external_number: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Número Interior (Opcional)</label>
                  <input placeholder="Ej. Depto 4" type="text" style={inputStyle} value={addressForm.internal_number} onChange={e => setAddressForm({ ...addressForm, internal_number: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Código Postal</label>
                  <input required placeholder="Ej. 06100" type="text" style={inputStyle} value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Colonia</label>
                  <input required placeholder="Ej. Roma Norte" type="text" style={inputStyle} value={addressForm.neighborhood} onChange={e => setAddressForm({ ...addressForm, neighborhood: e.target.value })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Referencias o Comentarios (Opcional)</label>
                  <textarea placeholder="Ej. Edificio azul, dejar en recepción." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={addressForm.references_comments} onChange={e => setAddressForm({ ...addressForm, references_comments: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={submittingAddress} style={{ ...submitButtonStyle, opacity: submittingAddress ? 0.7 : 1 }}>
                {submittingAddress ? 'Guardando...' : 'Guardar Dirección'}
              </button>
            </form>
          )}
        </div>

        {/* --- DATOS BANCARIOS (PAYOUT) --- */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Datos Bancarios (Para recibir pagos por tus libros)</h2>
          {payout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                backgroundColor: payout.is_active === 1 ? '#ebf4ec' : '#fef3c7',
                padding: '1rem 1.5rem', borderRadius: '12px',
                border: `1px solid ${payout.is_active === 1 ? '#a8c4af' : '#fde68a'}`,
                display: 'flex', alignItems: 'center', gap: '1rem'
              }}>
                <div style={{ fontSize: '1.5rem' }}>{payout.is_active === 1 ? '✅' : '⏳'}</div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.95rem', fontWeight: 700, color: payout.is_active === 1 ? '#1B3022' : '#92400e', margin: 0 }}>
                  Estado de cuenta: {payout.is_active === 1 ? 'Activa' : 'Pendiente de Revisión'}
                </p>
              </div>

              <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <p style={labelStyle}>Titular de la Cuenta</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: 0, fontSize: '1rem' }}>{payout.account_holder_name}</p>
                </div>
                <div>
                  <p style={labelStyle}>Banco</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: 0, fontSize: '1rem' }}>{payout.bank_name}</p>
                </div>
                <div>
                  <p style={labelStyle}>CLABE Interbancaria</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#111827', margin: 0, fontSize: '1rem', letterSpacing: '1px' }}>{payout.clabe}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePayoutSubmit}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.95rem', color: '#4b5563', marginBottom: '1.5rem' }}>
                Registra los datos de la cuenta bancaria donde depositaremos las ganancias de tus libros vendidos. Revisa bien la información antes de guardar.
              </p>
              <div>
                <label style={labelStyle}>Nombre del Titular de la Cuenta</label>
                <input required placeholder="Tal como aparece en el banco" type="text" style={inputStyle} value={payoutForm.account_holder_name} onChange={e => setPayoutForm({ ...payoutForm, account_holder_name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Nombre del Banco</label>
                <input required placeholder="Ej. BBVA, Santander, Banorte..." type="text" style={inputStyle} value={payoutForm.bank_name} onChange={e => setPayoutForm({ ...payoutForm, bank_name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>CLABE Interbancaria (18 dígitos)</label>
                <input required placeholder="000000000000000000" type="text" maxLength={18} pattern="\d{18}" title="Debe contener exactamente 18 dígitos numéricos" style={inputStyle} value={payoutForm.clabe} onChange={e => setPayoutForm({ ...payoutForm, clabe: e.target.value.replace(/\D/g, '') })} />
              </div>
              <button type="submit" disabled={submittingPayout} style={{ ...submitButtonStyle, backgroundColor: '#A67C00', opacity: submittingPayout ? 0.7 : 1 }}>
                {submittingPayout ? 'Guardando...' : 'Guardar Información Bancaria'}
              </button>
            </form>
          )}
        </div>
        {/* --- SOPORTE --- */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', color: '#666' }}>
            ¿Ves algún error en tus datos? Por favor contacta a nuestro equipo de soporte{' '}
            <a
              href="https://wa.me/524426067589?text=Hola, necesito ayuda con mis datos en LibroLoop"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1B3022', fontWeight: 700, textDecoration: 'underline' }}
            >
              aquí
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
