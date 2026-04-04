// TypeScript types for the multi-role system

export type UserRole = 'comprador' | 'vendedor' | 'admin'

export interface Profile {
    id: string
    email: string
    roles: UserRole[]
    name?: string
    phone?: string
    created_at: string
}

export interface SellerProfile {
    user_id: string
    business_name?: string
    bank_account?: string
    tax_id?: string
    verified: boolean
    onboarding_completed: boolean
    created_at: string
}

export interface Address {
    id: string
    user_id: string
    street: string
    city: string
    state: string
    zip_code: string
    country: string
    is_default: boolean
    created_at: string
}

export interface Order {
    id: string
    buyer_id: string
    seller_id: string
    book_id: string
    quantity: number
    total_price: number
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
    shipping_address_id: string
    created_at: string
    book?: Book // Populated via join
    shipping_address?: Address // Populated via join
}

export interface Book {
    id: string
    title: string
    author: string
    year?: number
    publisher?: string
    isbn?: string
    genre?: string
    language?: string
    page_count?: number
    description?: string
    link_amazon?: string
    link_sotano?: string
    link_buscalibre?: string
    link_gandhi?: string
    publish_front_image_url?: string
    publish_back_image_url?: string
    original_price: number
    sale_price: number
    status_code: number
    rejection_comment?: string
    review_at?: string
    rejected_at?: string
    accepted_at?: string
    created_at: string
}

// Helper type guards
export function hasRole(profile: Profile | null, role: UserRole): boolean {
    return profile?.roles?.includes(role) ?? false
}

export function isBuyer(profile: Profile | null): boolean {
    return hasRole(profile, 'comprador')
}

export function isSeller(profile: Profile | null): boolean {
    return hasRole(profile, 'vendedor')
}

export function isAdmin(profile: Profile | null): boolean {
    return hasRole(profile, 'admin')
}

