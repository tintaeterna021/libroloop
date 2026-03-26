// Cart utilities for localStorage management

import { GuestCart, GuestCartItem } from './types'

const CART_STORAGE_KEY = 'libroloop_guest_cart'

// Get cart from localStorage
export function getGuestCart(): GuestCart {
    if (typeof window === 'undefined') return { items: [], updated_at: new Date().toISOString() }

    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (!stored) return { items: [], updated_at: new Date().toISOString() }
        return JSON.parse(stored)
    } catch {
        return { items: [], updated_at: new Date().toISOString() }
    }
}

// Save cart to localStorage
export function saveGuestCart(cart: GuestCart): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
            ...cart,
            updated_at: new Date().toISOString()
        }))
    } catch (error) {
        console.error('Failed to save cart:', error)
    }
}

// Add item to cart
export function addToGuestCart(bookId: string, quantity: number = 1): void {
    const cart = getGuestCart()
    const existingItem = cart.items.find(item => item.book_id === bookId)

    if (existingItem) {
        existingItem.quantity += quantity
    } else {
        cart.items.push({ book_id: bookId, quantity })
    }

    saveGuestCart(cart)
}

// Update item quantity
export function updateGuestCartItem(bookId: string, quantity: number): void {
    const cart = getGuestCart()
    const item = cart.items.find(item => item.book_id === bookId)

    if (item) {
        if (quantity <= 0) {
            cart.items = cart.items.filter(item => item.book_id !== bookId)
        } else {
            item.quantity = quantity
        }
        saveGuestCart(cart)
    }
}

// Remove item from cart
export function removeFromGuestCart(bookId: string): void {
    const cart = getGuestCart()
    cart.items = cart.items.filter(item => item.book_id !== bookId)
    saveGuestCart(cart)
}

// Clear entire cart
export function clearGuestCart(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(CART_STORAGE_KEY)
}

// Get cart item count
export function getGuestCartCount(): number {
    const cart = getGuestCart()
    return cart.items.reduce((total, item) => total + item.quantity, 0)
}

// Migrate guest cart to user cart (after login)
export async function migrateGuestCartToUser(supabase: any, userId: string): Promise<void> {
    const guestCart = getGuestCart()

    if (guestCart.items.length === 0) return

    try {
        // Insert all guest cart items into user's cart
        const cartItems = guestCart.items.map(item => ({
            user_id: userId,
            book_id: item.book_id,
            quantity: item.quantity
        }))

        const { error } = await supabase
            .from('cart_items')
            .upsert(cartItems, {
                onConflict: 'user_id,book_id',
                ignoreDuplicates: false
            })

        if (error) throw error

        // Clear guest cart after successful migration
        clearGuestCart()
    } catch (error) {
        console.error('Failed to migrate cart:', error)
        throw error
    }
}
