'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { getGuestCart, removeFromGuestCart, addToGuestCart, clearGuestCart } from './cart'
import { supabase } from './supabase'
import { Book } from './types'

export interface CartBookItem {
    book_id: string
    book: Book
}

interface CartContextType {
    isOpen: boolean
    items: CartBookItem[]
    openCart: () => void
    closeCart: () => void
    addAndOpen: (bookId: string) => void
    removeItem: (bookId: string) => void
    refreshCart: () => void
    clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [items, setItems] = useState<CartBookItem[]>([])

    const refreshCart = useCallback(async () => {
        const guestCart = getGuestCart()
        if (guestCart.items.length === 0) {
            setItems([])
            return
        }
        const ids = guestCart.items.map(i => i.book_id)
        const { data } = await supabase
            .from('books')
            .select('*')
            .in('id', ids)

        if (data) {
            const enriched: CartBookItem[] = guestCart.items
                .map(ci => {
                    const book = data.find(b => b.id === ci.book_id)
                    return book ? { book_id: ci.book_id, book } : null
                })
                .filter(Boolean) as CartBookItem[]
            setItems(enriched)
        }
    }, [])

    // Load cart once on mount
    useEffect(() => {
        refreshCart()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const openCart = useCallback(() => {
        setIsOpen(true)
    }, [])

    const closeCart = useCallback(() => {
        setIsOpen(false)
    }, [])

    const addAndOpen = useCallback(async (bookId: string) => {
        addToGuestCart(bookId, 1)
        await refreshCart()
        setIsOpen(true)
    }, [refreshCart])

    const removeItem = useCallback((bookId: string) => {
        removeFromGuestCart(bookId)
        setItems(prev => prev.filter(i => i.book_id !== bookId))
    }, [])

    const clearCart = useCallback(() => {
        clearGuestCart()
        setItems([])
    }, [])

    return (
        <CartContext.Provider value={{ isOpen, items, openCart, closeCart, addAndOpen, removeItem, refreshCart, clearCart }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be used inside CartProvider')
    return ctx
}
