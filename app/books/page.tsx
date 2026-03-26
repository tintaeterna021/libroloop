'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Book {
    id: string
    title: string
    author: string
    price: number
    image_url: string
    description: string
}

export default function BooksGallery() {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchBooks() {
            const { data } = await supabase
                .from('books')
                .select('*')
                .eq('status', 'disponible')

            if (data) setBooks(data)
            setLoading(false)
        }
        fetchBooks()
    }, [])

    if (loading) return <div className="p-8 text-center">Cargando libros...</div>

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Descubre tu próxima lectura</h1>
                    <p className="text-lg text-gray-600">Explora nuestra colección de libros usados y dales una segunda vida.</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {books.map((book) => (
                        <div key={book.id} className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="aspect-[3/4] w-full bg-gray-200 relative overflow-hidden">
                                {book.image_url ? (
                                    <img
                                        src={book.image_url}
                                        alt={book.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <span className="text-sm font-medium">Sin imagen</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                                    <span className="text-indigo-600 font-bold">${book.price}</span>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                    {book.title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">{book.author}</p>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-grow">
                                    {book.description || 'Sin descripción disponible.'}
                                </p>

                                <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition active:scale-[0.98]">
                                    Ver detalles
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {books.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-gray-500 text-lg">No hay libros disponibles en este momento.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
