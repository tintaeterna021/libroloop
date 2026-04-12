'use client'

import Link from 'next/link'
import { useCart } from '@/lib/CartContext'

export default function CheckoutPlaceholder() {
    const { cartItems } = useCart()
    
    return (
        <div style={{ minHeight: '60vh', backgroundColor: '#F5F2E7', padding: '4rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#1A1A1A', marginBottom: '1rem' }}>
                    Checkout
                </h1>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', color: '#555', marginBottom: '2rem' }}>
                    Tienes {cartItems.length} artículos en tu carrito listos para comprar. El proceso de pago se implementará próximamente.
                </p>
                <Link 
                    href="/catalogo"
                    style={{
                        backgroundColor: '#1B3022',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '999px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-block'
                    }}
                >
                    Volver al catálogo
                </Link>
            </div>
        </div>
    )
}
