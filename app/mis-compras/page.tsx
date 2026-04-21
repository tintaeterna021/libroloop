'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type OrderBook = {
  id: string
  title: string
  author: string
  publish_front_image_url: string | null
  sale_price: number
}

type Order = {
  id: string
  order_number: number
  total: number
  shipping_cost: number
  total_with_shipping: number
  status_code: number
  created_at: string
  preparation_at: string | null
  delivered_at: string | null
  payment_method: string
}


export default function MisComprasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchCompras = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando pedidos', error)
      } else {
        setOrders(data || [])
      }
      setLoading(false)
    }

    fetchCompras()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F2E7' }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#1B3022', fontWeight: 600 }}>Cargando tus compras...</p>
      </div>
    )
  }

  const activeOrders = orders.filter(o => o.status_code < 4)
  const pastOrders = orders.filter(o => o.status_code === 4)

  return (
    <div style={{ backgroundColor: '#F5F2E7', minHeight: '100vh', paddingBottom: '6rem' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1B3022', padding: '3.5rem 1.5rem', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#fff', marginBottom: '0.5rem' }}>
            Mis Compras
          </h1>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Revisa el estado de tus pedidos
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {orders.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1.5px dashed #dedad2' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', color: '#666', marginBottom: '1.5rem' }}>
              Aún no has realizado ninguna compra.
            </p>
            <Link href="/catalogo" style={{ display: 'inline-block', backgroundColor: '#1B3022', color: 'white', textDecoration: 'none', padding: '0.8rem 2rem', borderRadius: '999px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.9rem' }}>
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <>
            {/* Pedidos Activos */}
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#1B3022', marginBottom: '1.5rem' }}>
              📦 Pedidos Activos
            </h2>
            {activeOrders.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', textAlign: 'center', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#888', margin: 0 }}>No tienes pedidos en curso.</p>
              </div>
            ) : (
              <div style={{ marginBottom: '3rem' }}>
                {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            )}

            {/* Historial */}
            {pastOrders.length > 0 && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#1B3022', marginBottom: '1.5rem' }}>
                  Historial de Compras
                </h2>
                <div>
                  {pastOrders.map(order => <OrderCard key={order.id} order={order} isHistory />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

    </div>
  )
}

function OrderCard({ order, isHistory = false }: { order: Order; isHistory?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [books, setBooks] = useState<OrderBook[]>([])
  const [bookCount, setBookCount] = useState<number | null>(null)
  const [loadingBooks, setLoadingBooks] = useState(false)

  // Fetch book count eagerly so the summary can show it
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id)
      setBookCount(count ?? 0)
    }
    fetchCount()
  }, [order.id])

  const toggle = async () => {
    if (!isOpen && books.length === 0) {
      setLoadingBooks(true)
      const { data } = await supabase
        .from('books')
        .select('id, title, author, publish_front_image_url, sale_price')
        .eq('order_id', order.id)
      if (data) setBooks(data as OrderBook[])
      setLoadingBooks(false)
    }
    setIsOpen(!isOpen)
  }

  const getStatusInfo = () => {
    switch (order.status_code) {
      case 1: return { label: 'Confirmación de pago', color: '#856404', bg: '#fff3cd' }
      case 2: return { label: 'Preparación', color: '#0c5460', bg: '#d1ecf1' }
      case 3: return { label: 'En ruta', color: '#004085', bg: '#cce5ff' }
      case 4: return { label: 'Entregado', color: '#155724', bg: '#d4edda' }
      default: return { label: 'Procesando', color: '#383d41', bg: '#e2e3e5' }
    }
  }

  const getRelevantDate = () => {
    if (order.status_code === 1) return order.created_at
    if (order.status_code === 2 || order.status_code === 3) return order.preparation_at || order.created_at
    if (order.status_code === 4) return order.delivered_at || order.created_at
    return order.created_at
  }

  const status = getStatusInfo()
  const total = Number(order.total_with_shipping)
  const shipping = Number(order.shipping_cost)
  const subtotal = Number(order.total)
  const tenPercent = total * 0.1
  const ninetyPercent = total * 0.9
  const relevantDate = new Date(getRelevantDate()).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      border: isHistory ? '1px solid #e5e7eb' : '2px solid #1B3022',
      overflow: 'hidden',
      marginBottom: '1.5rem',
      boxShadow: isHistory ? 'none' : '0 12px 24px rgba(27,48,34,0.08)'
    }}>

      {/* ── Summary (always visible) ── */}
      <div style={{ padding: '1.8rem' }}>

        {/* Top row: order number + status pill + chevron */}
        <div onClick={toggle} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.2rem', color: '#1B3022' }}>
                #LL-{order.order_number}
              </span>
              <div style={{ backgroundColor: status.bg, color: status.color, padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' as const }}>
                {status.label}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#888' }}>
              <span>📅 {relevantDate}</span>
              {bookCount !== null && (
                <span>📚 {bookCount} {bookCount === 1 ? 'libro' : 'libros'}</span>
              )}
            </div>
          </div>
          <div style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', fontSize: '1.1rem', color: '#1B3022', marginLeft: '1rem', flexShrink: 0 }}>
            ▼
          </div>
        </div>

        {/* Status Message */}
        <div style={{ backgroundColor: '#F9FBF9', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid #EBF1EB', marginBottom: '1rem' }}>
          {order.status_code === 1 && (
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.88rem', color: '#1B3022', margin: 0, fontWeight: 500 }}>
              ⚠️ <strong>Acción requerida:</strong> Confirma tu pedido con el 10% de tu total:{' '}
              <span style={{ fontWeight: 800 }}>${tenPercent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </p>
          )}
          {(order.status_code === 2 || order.status_code === 3) && (
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.88rem', color: '#1B3022' }}>
              <p style={{ fontWeight: 500, margin: '0 0 0.4rem 0' }}>
                💵 <strong>Por pagar (90%):</strong>{' '}
                <span style={{ fontWeight: 800 }}>${ninetyPercent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </p>
              <p style={{ fontSize: '0.78rem', color: '#666', fontStyle: 'italic', margin: 0 }}>
                {order.payment_method === 'efectivo'
                  ? 'Si pagas en efectivo, recuerda tener cambio por favor para agilizar la entrega.'
                  : 'Si pagas por transferencia, puedes ir guardando nuestros datos para agilizar el proceso al momento de la entrega.'}
              </p>
            </div>
          )}
          {order.status_code === 4 && (
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.88rem', color: '#1B3022', margin: 0, fontWeight: 500 }}>
              📚 ✨ ¡Te deseamos una buena lectura! Escríbenos tus quejas, sugerencias y comentarios a nuestro{' '}
              <a href="https://wa.me/524426067589" target="_blank" rel="noopener noreferrer" style={{ color: '#1B3022', fontWeight: 700 }}>WhatsApp</a>{' '}
              o Instagram.
            </p>
          )}
        </div>

        {/* Price Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#555' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Libros:</span>
            <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Envío:</span>
            <span>{shipping === 0 ? 'Gratis 🎉' : `$${shipping.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#1B3022', borderTop: '1px dashed #ddd', paddingTop: '0.35rem', marginTop: '0.15rem', fontSize: '0.95rem' }}>
            <span>Total:</span>
            <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

      </div>

      {/* ── Expandable: book details only ── */}
      {isOpen && (
        <div style={{ padding: '0 1.8rem 1.8rem' }}>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '1.2rem' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              Detalle de libros
            </p>
            {loadingBooks ? (
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#999' }}>Cargando libros...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {books.map(book => (
                  <div key={book.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '55px', height: '75px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f0f0f0', flexShrink: 0 }}>
                      {book.publish_front_image_url ? (
                        <img src={book.publish_front_image_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📚</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#1B3022', margin: '0 0 0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {book.title}
                      </p>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', color: '#777', margin: 0 }}>
                        {book.author}
                      </p>
                    </div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.95rem', fontWeight: 800, color: '#1B3022', flexShrink: 0 }}>
                      ${Number(book.sale_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

