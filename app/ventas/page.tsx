'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface SellerBook {
  id: string
  title: string
  author: string
  original_front_image_url: string
  publish_front_image_url: string
  status_code: number
  seller_payout_amount: number | null
  rejection_comment: string | null
}

export default function MisVentasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<SellerBook[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'status'>('name')



  useEffect(() => {
    const fetchVentas = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando libros', error)
      } else {
        setBooks(data || [])
      }
      setLoading(false)
    }

    fetchVentas()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F2E7' }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#1B3022', fontWeight: 600 }}>Cargando centro de negocios...</p>
      </div>
    )
  }

  // Cálculos Técnicos
  const totalGenerado = books.filter(b => b.status_code === 10).reduce((sum, b) => sum + (Number(b.seller_payout_amount) || 0), 0)
  const saldoPendiente = books.filter(b => b.status_code === 9).reduce((sum, b) => sum + (Number(b.seller_payout_amount) || 0), 0)
  const totalVendidosConteo = books.filter(b => b.status_code === 9 || b.status_code === 10).length

  // Lógica de ordenamiento
  const sortedBooks = [...books].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.title || 'Libro En Revisión').localeCompare(b.title || 'Libro En Revisión')
    }
    if (sortBy === 'status') {
      return a.status_code - b.status_code
    }
    return 0 
  })



  const renderStatusBadge = (book: SellerBook) => {
    switch (book.status_code) {
      case 1:
        return (
          <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            ⏳ En revisión
          </div>
        )
      case 2:
        return (
          <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            ❌ No Aprobado
          </div>
        )
      case 4:
      case 5:
        return (
          <div style={{ backgroundColor: '#d1ecf1', color: '#0c5460', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            📝 Aprobado
          </div>
        )
      case 6:
      case 7:
      case 8:
      case 13:
        return (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            ✅ Publicado en Tienda
          </div>
        )
      case 9:
        return (
          <div style={{ backgroundColor: '#FDF1DD', color: '#8c6014', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', border: '1px solid #d4a956' }}>
            🎉 Vendido (Pendiente)
          </div>
        )
      case 10:
        return (
          <div style={{ backgroundColor: '#e2e3e5', color: '#383d41', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            💰 Liquidado Correctamente
          </div>
        )
      case 11:
        return (
          <div style={{ backgroundColor: '#e2e3e5', color: '#6c757d', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            🗑️ Dado de baja
          </div>
        )
      case 12:
        return (
          <div style={{ backgroundColor: '#e2e3e5', color: '#6c757d', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            📦 Devuelto
          </div>
        )
      default:
        return (
          <div style={{ backgroundColor: '#e2e3e5', color: '#6c757d', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            Procesando...
          </div>
        )
    }
  }

  const renderStatusDesc = (book: SellerBook) => {
    switch (book.status_code) {
      case 1: return "Estamos analizando las fotos (Máx 24 hrs)."
      case 2: return `${book.rejection_comment ? book.rejection_comment.replace(/\.$/, '') + ". " : "No cumple con nuestros criterios de calidad. "}¡Anímate a probar con otros libros que tengas en casa!`
      case 4:
      case 5:
        return "Estamos gestionando los últimos detalles para poder publicar tu libro."
      case 6:
      case 7:
      case 8:
      case 13:
        return "Tu libro ya está disponible en nuestro catálogo para todos."
      case 9: return "Este libro ya tiene nuevo dueño. Tu saldo se actualizará en tu próximo corte."
      case 10: return "El pago por este ejemplar ya fue transferido a tu cuenta."
      case 11: return "Este libro ha sido dado de baja de nuestro catálogo. ¡No te desanimes! Te invitamos a vender otros libros que tengas por ahí."
      case 12: return "Este libro te ha sido devuelto a tu domicilio. ¡Aún así, nos encantaría que pruebes vender otros libros con nosotros!"
      default: return null
    }
  }

  return (
    <div style={{ backgroundColor: '#F5F2E7', minHeight: '100vh', paddingBottom: '6rem', position: 'relative' }}>

      {/* Header and Cards Section */}
      <div style={{ backgroundColor: '#1B3022', padding: '3.5rem 1.5rem', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#fff', marginBottom: '2.5rem' }}>Panel de Ganancias</h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.8rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Ganancias Totales</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '2.5rem', color: '#1B3022', fontWeight: 900 }}>
                ${totalGenerado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>Todo lo generado históricamente</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.8rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: '#c0392b' }} />
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Saldo Pendiente</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '2.5rem', color: '#1B3022', fontWeight: 900 }}>
                ${saldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div style={{ display: 'inline-block', backgroundColor: '#fff3f3', padding: '0.3rem 0.6rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', color: '#c0392b', fontWeight: 600, margin: 0 }}>
                  Los cortes se hacen los días 15 y 30.
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.8rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Libros Vendidos</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '2.5rem', color: '#1B3022', fontWeight: 900 }}>
                {totalVendidosConteo}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>Ejemplares que han salido</p>
            </div>

          </div>
        </div>
      </div>

      {/* Inventario List */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#1B3022', margin: 0 }}>Estado del Inventario</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Ordenar por:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd', 
                fontFamily: "'Montserrat', sans-serif", 
                fontSize: '0.85rem',
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <option value="name">Nombre</option>
              <option value="status">Estado</option>
            </select>

          </div>
        </div>


        {books.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1.5px dashed #dedad2' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', color: '#666', marginBottom: '1.5rem' }}>Aún no hay registros de envíos de libros a Libroloop.</p>
            <Link href="/vender" style={{ display: 'inline-block', backgroundColor: '#1B3022', color: 'white', textDecoration: 'none', padding: '0.8rem 2rem', borderRadius: '999px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.9rem' }}>
              Subir mi primer libro
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {sortedBooks.map(book => (

              <div key={book.id} style={{ display: 'flex', gap: '1.5rem', backgroundColor: 'white', borderRadius: '16px', padding: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', alignItems: 'center' }}>
                {/* Thumbnail */}
                <div style={{ width: '85px', height: '120px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                  {book.original_front_image_url ? (
                    <img
                      src={book.original_front_image_url}
                      alt={book.title || 'Libro sin título'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                      📚
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#1B3022', margin: '0 0 1rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {book.title || 'Libro En Revisión'}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                    {renderStatusBadge(book)}
                    {renderStatusDesc(book) && (
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#777', margin: 0, fontStyle: 'italic', maxWidth: '400px' }}>
                        {renderStatusDesc(book)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Optional Payout display for sold items */}
                {(book.status_code === 9 || book.status_code === 10) && book.seller_payout_amount && (
                  <div style={{ textAlign: 'right', paddingLeft: '1rem', borderLeft: '1px solid #eee' }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', color: '#888', fontWeight: 600, margin: '0 0 0.3rem 0', textTransform: 'uppercase' }}>Ganado</p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.4rem', color: '#1B3022', fontWeight: 800, margin: 0 }}>
                      ${Number(book.seller_payout_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating CTA & Legal */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        <Link href="/vender" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: '#1B3022', color: 'white', textDecoration: 'none',
          padding: '1.2rem 2.5rem', borderRadius: '999px', boxShadow: '0 8px 30px rgba(27,48,34,0.35)',
          fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '0.95rem',
        }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>+</span> Vender más libros
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem', paddingBottom: '2rem' }}>
        <a href="#" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#888', textDecoration: 'underline' }}>
          Ver mi contrato de consignación (24 meses)
        </a>
      </div>

    </div>
  )
}
