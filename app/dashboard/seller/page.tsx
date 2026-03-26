'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Stats {
    totalBooks: number
    availableBooks: number
    soldBooks: number
    totalRevenue: number
}

export default function SellerDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalBooks: 0,
        availableBooks: 0,
        soldBooks: 0,
        totalRevenue: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch all books
            const { data: books } = await supabase
                .from('books')
                .select('*')
                .eq('seller_id', user.id)

            const total = books?.length || 0
            const available = books?.filter(b => b.status === 'available').length || 0
            const sold = books?.filter(b => b.status === 'sold').length || 0
            const revenue = books?.filter(b => b.status === 'sold').reduce((sum, b) => sum + b.price, 0) || 0

            setStats({
                totalBooks: total,
                availableBooks: available,
                soldBooks: sold,
                totalRevenue: revenue
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="mb-12">
                    <h2 className="text-5xl font-black text-white mb-4">Dashboard de Vendedor</h2>
                    <p className="text-white/60 text-lg">Gestiona tus libros y ventas</p>
                </div>

                {loading ? (
                    <div className="text-center text-white/60 py-16">
                        <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                        <p>Cargando estadísticas...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-4 gap-6 mb-12">
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6">
                                <div className="text-4xl mb-3">📚</div>
                                <div className="text-4xl font-black text-white mb-1">{stats.totalBooks}</div>
                                <div className="text-blue-300 text-sm font-medium">Libros Totales</div>
                            </div>

                            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-6">
                                <div className="text-4xl mb-3">✅</div>
                                <div className="text-4xl font-black text-white mb-1">{stats.availableBooks}</div>
                                <div className="text-green-300 text-sm font-medium">Disponibles</div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6">
                                <div className="text-4xl mb-3">💼</div>
                                <div className="text-4xl font-black text-white mb-1">{stats.soldBooks}</div>
                                <div className="text-purple-300 text-sm font-medium">Vendidos</div>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6">
                                <div className="text-4xl mb-3">💰</div>
                                <div className="text-4xl font-black text-white mb-1">${stats.totalRevenue.toFixed(2)}</div>
                                <div className="text-yellow-300 text-sm font-medium">Ingresos</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-white mb-6">Acciones Rápidas</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <Link
                                    href="/vender/nuevo"
                                    className="bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 rounded-2xl p-8 transition group"
                                >
                                    <div className="text-5xl mb-4">📖</div>
                                    <h4 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition">
                                        Vender Libro
                                    </h4>
                                    <p className="text-white/60">Publica un nuevo libro en el marketplace</p>
                                </Link>

                                <Link
                                    href="/dashboard/seller/books"
                                    className="bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 rounded-2xl p-8 transition group"
                                >
                                    <div className="text-5xl mb-4">📚</div>
                                    <h4 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
                                        Mis Libros
                                    </h4>
                                    <p className="text-white/60">Ver y gestionar todos tus libros publicados</p>
                                </Link>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">💡 Consejos para Vender Más</h3>
                            <ul className="space-y-3 text-white/70">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Usa fotos de buena calidad para tus libros</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Describe detalladamente el estado del libro</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Mantén precios competitivos</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Actualiza el estado de tus libros regularmente</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
