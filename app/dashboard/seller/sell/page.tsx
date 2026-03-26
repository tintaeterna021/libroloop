'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SellBookPage() {
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [isbn, setIsbn] = useState('')
    const [condition, setCondition] = useState<'new' | 'like_new' | 'good' | 'acceptable'>('good')
    const [category, setCategory] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [authChecking, setAuthChecking] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)
    const router = useRouter()

    // Check authentication and role on mount
    useEffect(() => {
        checkAccess()
    }, [])

    async function checkAccess() {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('roles')
                .eq('id', user.id)
                .single()

            const hasVendedorRole = profile?.roles?.includes('vendedor') || profile?.roles?.includes('admin')

            if (!hasVendedorRole) {
                router.push('/')
                return
            }

            setHasAccess(true)
        } catch (error) {
            console.error('Error checking access:', error)
            router.push('/login')
        } finally {
            setAuthChecking(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Debes iniciar sesión')

            // Insert book
            const { error: insertError } = await supabase
                .from('books')
                .insert([
                    {
                        title,
                        author,
                        description,
                        price: parseFloat(price),
                        seller_id: user.id,
                        isbn,
                        condition,
                        category,
                        image_url: imageUrl || null,
                        status: 'available'
                    }
                ])

            if (insertError) throw insertError

            setSuccess(true)
            // Reset form
            setTitle('')
            setAuthor('')
            setDescription('')
            setPrice('')
            setIsbn('')
            setCondition('good')
            setCategory('')
            setImageUrl('')

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/dashboard/seller/books')
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Error al publicar el libro')
        } finally {
            setLoading(false)
        }
    }

    // Show loading while checking access
    if (authChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                    <p>Verificando acceso...</p>
                </div>
            </div>
        )
    }

    // Don't render form if user doesn't have access (will redirect)
    if (!hasAccess) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2">Vender Libro</h1>
                    <p className="text-white/60">Publica un libro para vender en el marketplace</p>
                </div>

                {success && (
                    <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                        <p className="text-green-400 font-medium">✓ Libro publicado exitosamente. Redirigiendo...</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                        <p className="text-red-400 font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            Título del Libro *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                            placeholder="Ej: Cien Años de Soledad"
                        />
                    </div>

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            Autor *
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                            placeholder="Ej: Gabriel García Márquez"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition resize-none"
                            placeholder="Describe el libro, su estado, etc."
                        />
                    </div>

                    {/* Price and ISBN */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                Precio (MXN) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                                placeholder="150.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                ISBN (Opcional)
                            </label>
                            <input
                                type="text"
                                value={isbn}
                                onChange={(e) => setIsbn(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                                placeholder="978-3-16-148410-0"
                            />
                        </div>
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">
                            Condición del Libro *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { value: 'new', label: 'Nuevo', emoji: '✨' },
                                { value: 'like_new', label: 'Como Nuevo', emoji: '🌟' },
                                { value: 'good', label: 'Bueno', emoji: '👍' },
                                { value: 'acceptable', label: 'Aceptable', emoji: '📖' }
                            ].map((cond) => (
                                <button
                                    key={cond.value}
                                    type="button"
                                    onClick={() => setCondition(cond.value as any)}
                                    className={`p-4 rounded-lg border-2 transition ${condition === cond.value
                                        ? 'bg-white/10 border-white text-white'
                                        : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{cond.emoji}</div>
                                    <div className="text-xs font-medium">{cond.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            Categoría
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                        >
                            <option value="">Selecciona una categoría</option>
                            <option value="ficcion">Ficción</option>
                            <option value="no-ficcion">No Ficción</option>
                            <option value="ciencia">Ciencia</option>
                            <option value="tecnologia">Tecnología</option>
                            <option value="historia">Historia</option>
                            <option value="arte">Arte</option>
                            <option value="infantil">Infantil</option>
                            <option value="academico">Académico</option>
                        </select>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            URL de Imagen (Opcional)
                        </label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                            placeholder="https://ejemplo.com/imagen.jpg"
                        />
                        {imageUrl && (
                            <div className="mt-3">
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className="w-32 h-48 object-cover rounded-lg border border-white/20"
                                    onError={() => setImageUrl('')}
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    <span>Publicando...</span>
                                </>
                            ) : (
                                'Publicar Libro'
                            )}
                        </button>
                        <Link
                            href="/dashboard/seller"
                            className="px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition text-center"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
