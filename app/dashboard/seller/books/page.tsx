'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Book } from '@/lib/types'
import Link from 'next/link'

export default function SellerBooksPage() {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMyBooks()
    }, [])

    async function fetchMyBooks() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setBooks(data || [])
        } catch (error) {
            console.error('Error fetching books:', error)
        } finally {
            setLoading(false)
        }
    }

    async function deleteBook(id: string) {
        if (!confirm('¿Estás seguro de eliminar este libro?')) return

        try {
            const { error } = await supabase
                .from('books')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchMyBooks()
        } catch (error) {
            console.error('Error deleting book:', error)
            alert('Error al eliminar el libro')
        }
    }

    async function updateStatus(id: string, status: string) {
        try {
            const { error } = await supabase
                .from('books')
                .update({ status })
                .eq('id', id)

            if (error) throw error
            fetchMyBooks()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2">Mis Libros</h1>
                    <p className="text-white/60">{books.length} {books.length === 1 ? 'libro publicado' : 'libros publicados'}</p>
                </div>

                {loading ? (
                    <div className="text-center text-white/60 py-16">
                        <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                        <p>Cargando libros...</p>
                    </div>
                ) : books.length === 0 ? (
                    <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="text-6xl mb-4">📚</div>
                        <h2 className="text-2xl font-bold text-white mb-2">No tienes libros publicados</h2>
                        <p className="text-white/60 mb-6">Comienza a vender publicando tu primer libro</p>
                        <Link
                            href="/vender/nuevo"
                            className="inline-block px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition"
                        >
                            Vender Libro
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {books.map((book) => (
                            <div
                                key={book.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-6 flex gap-6"
                            >
                                {/* Book Image */}
                                <div className="w-24 h-32 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {book.image_url ? (
                                        <img
                                            src={book.image_url}
                                            alt={book.title}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-3xl">📖</div>
                                    )}
                                </div>

                                {/* Book Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">{book.title}</h3>
                                            <p className="text-sm text-white/50">{book.author}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white">${book.price.toFixed(2)}</p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${book.status === 'available' ? 'bg-green-500/20 text-green-400' :
                                                book.status === 'sold' ? 'bg-gray-500/20 text-gray-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {book.status === 'available' ? 'Disponible' :
                                                    book.status === 'sold' ? 'Vendido' : 'En Revisión'}
                                            </span>
                                        </div>
                                    </div>

                                    {book.description && (
                                        <p className="text-white/60 text-sm mb-4 line-clamp-2">{book.description}</p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-white/40">
                                        {book.condition && (
                                            <span>Condición: {book.condition}</span>
                                        )}
                                        {book.category && (
                                            <span>Categoría: {book.category}</span>
                                        )}
                                        <span>Publicado: {new Date(book.created_at).toLocaleDateString()}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4">
                                        <select
                                            value={book.status}
                                            onChange={(e) => updateStatus(book.id, e.target.value)}
                                            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                                        >
                                            <option value="available">Disponible</option>
                                            <option value="sold">Vendido</option>
                                            <option value="revision">En Revisión</option>
                                        </select>
                                        <button
                                            onClick={() => deleteBook(book.id)}
                                            className="px-4 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-sm hover:bg-red-500/30 transition"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
