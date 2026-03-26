'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Book } from '@/lib/types'
import {
    getGuestCart,
    updateGuestCartItem,
    removeFromGuestCart,
    clearGuestCart
} from '@/lib/cart'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartItemWithBook {
    book_id: string
    quantity: number
    book: Book | null
}

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItemWithBook[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        loadCart()
    }, [])

    async function loadCart() {
        try {
            const guestCart = getGuestCart()

            if (guestCart.items.length === 0) {
                setCartItems([])
                setLoading(false)
                return
            }

            // Fetch book details for all cart items
            const bookIds = guestCart.items.map(item => item.book_id)
            const { data: books, error } = await supabase
                .from('books')
                .select('*')
                .in('id', bookIds)

            if (error) throw error

            // Combine cart items with book data
            const itemsWithBooks = guestCart.items.map(item => ({
                ...item,
                book: books?.find(book => book.id === item.book_id) || null
            }))

            setCartItems(itemsWithBooks)
        } catch (error) {
            console.error('Error loading cart:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateQuantity = (bookId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(bookId)
            return
        }
        updateGuestCartItem(bookId, newQuantity)
        loadCart()
    }

    const handleRemoveItem = (bookId: string) => {
        removeFromGuestCart(bookId)
        loadCart()
    }

    const handleClearCart = () => {
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            clearGuestCart()
            setCartItems([])
        }
    }

    const total = cartItems.reduce((sum, item) => {
        return sum + (item.book?.price || 0) * item.quantity
    }, 0)

    const handleCheckout = () => {
        // Redirect to login/register before checkout
        router.push('/login?redirect=/checkout')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                    <p>Cargando carrito...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2">Tu Carrito</h1>
                        <p className="text-white/60">{cartItems.length} {cartItems.length === 1 ? 'libro' : 'libros'}</p>
                    </div>
                    {cartItems.length > 0 && (
                        <button
                            onClick={handleClearCart}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition"
                        >
                            Vaciar carrito
                        </button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="text-6xl mb-4">🛒</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Tu carrito está vacío</h2>
                        <p className="text-white/60 mb-6">Agrega algunos libros para comenzar</p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition"
                        >
                            Ver Catálogo
                        </Link>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div
                                    key={item.book_id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4"
                                >
                                    {/* Book Image */}
                                    <div className="w-24 h-32 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {item.book?.image_url ? (
                                            <img
                                                src={item.book.image_url}
                                                alt={item.book.title}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-3xl">📚</div>
                                        )}
                                    </div>

                                    {/* Book Info */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {item.book?.title || 'Libro no disponible'}
                                        </h3>
                                        <p className="text-sm text-white/50 mb-3">{item.book?.author}</p>
                                        <p className="text-xl font-bold text-white">
                                            ${item.book?.price.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex flex-col items-end justify-between">
                                        <button
                                            onClick={() => handleRemoveItem(item.book_id)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Eliminar
                                        </button>
                                        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.book_id, item.quantity - 1)}
                                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition"
                                            >
                                                −
                                            </button>
                                            <span className="w-8 text-center text-white font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.book_id, item.quantity + 1)}
                                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-24">
                                <h2 className="text-xl font-bold text-white mb-4">Resumen</h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-white/60">
                                        <span>Subtotal</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-white/60">
                                        <span>Envío</span>
                                        <span>Calculado en checkout</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-xl">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition mb-3"
                                >
                                    Proceder al Pago
                                </button>

                                <p className="text-xs text-white/40 text-center">
                                    Necesitas iniciar sesión para completar la compra
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
