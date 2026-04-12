'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Book } from '@/lib/types'

export interface CartItem {
    id: string
    title: string
    author: string
    original_price: number
    sale_price: number
    image_url?: string
}

interface CartContextType {
    cartItems: CartItem[]
    isCartOpen: boolean
    addToCart: (book: Book) => void
    removeFromCart: (bookId: string) => void
    clearCart: () => void
    toggleCart: () => void
    openCart: () => void
    closeCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // Cargar del local storage inicial
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('libroloop_cart')
            if (savedCart) {
                setCartItems(JSON.parse(savedCart))
            }
        } catch (e) {
            console.error('Error loading cart from localStorage:', e)
        }
        setIsInitialized(true)
    }, [])

    // Guardar en local storage con cada cambio
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('libroloop_cart', JSON.stringify(cartItems))
        }
    }, [cartItems, isInitialized])

    const addToCart = (book: Book) => {
        setCartItems(prev => {
            // Evitar duplicados
            if (prev.some(item => item.id === book.id)) {
                return prev
            }
            return [...prev, {
                id: book.id,
                title: book.title,
                author: book.author,
                original_price: Number(book.original_price),
                sale_price: Number(book.sale_price),
                image_url: book.publish_front_image_url
            }]
        })
    }

    const removeFromCart = (bookId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== bookId))
    }

    const clearCart = () => setCartItems([])
    const toggleCart = () => setIsCartOpen(prev => !prev)
    const openCart = () => setIsCartOpen(true)
    const closeCart = () => setIsCartOpen(false)

    return (
        <CartContext.Provider value={{
            cartItems,
            isCartOpen,
            addToCart,
            removeFromCart,
            clearCart,
            toggleCart,
            openCart,
            closeCart
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
