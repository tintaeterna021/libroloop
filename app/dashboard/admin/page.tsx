'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Stats {
    totalUsers: number
    totalBooks: number
    totalOrders: number
    totalRevenue: number
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalBooks: 0,
        totalOrders: 0,
        totalRevenue: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        try {
            // Fetch users count
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            // Fetch books count
            const { count: booksCount } = await supabase
                .from('books')
                .select('*', { count: 'exact', head: true })

            // Fetch orders count
            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })

            // Fetch total revenue
            const { data: orders } = await supabase
                .from('orders')
                .select('total')

            const revenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

            setStats({
                totalUsers: usersCount || 0,
                totalBooks: booksCount || 0,
                totalOrders: ordersCount || 0,
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
                    <h2 className="text-5xl font-black text-white mb-4">Panel de Control</h2>
                    <p className="text-white/60 text-lg">Gestiona todo el marketplace desde aquí</p>
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
                                <div className="text-4xl mb-3">👥</div>
                                <div className="text-4xl font-black text-white mb-1">{stats.totalUsers}</div>
                                <div className="text-blue-300 text-sm font-medium">Usuarios Totales</div>
                            </div>

                            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-6">
                                <div className="text-4xl mb-3">📚</div>
                                <div className="text-4xl font-black text-white mb-1">{stats.totalBooks}</div>
                                <div className="text-green-300 text-sm font-medium">Libros Publicados</div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6">
                                <div className="text-4xl mb-3">📦</div>
                                <div className="text-4xl font-black text-white mb-1">{stats.totalOrders}</div>
                                <div className="text-purple-300 text-sm font-medium">Órdenes Totales</div>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6">
                                <div className="text-4xl mb-3">💰</div>
                                <div className="text-4xl font-black text-white mb-1">${stats.totalRevenue.toFixed(2)}</div>
                                <div className="text-yellow-300 text-sm font-medium">Ingresos Totales</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-white mb-6">Acciones Rápidas</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <Link
                                    href="/dashboard/admin/users"
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition group"
                                >
                                    <div className="text-4xl mb-3">👥</div>
                                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
                                        Gestionar Usuarios
                                    </h4>
                                    <p className="text-white/60 text-sm">Ver y administrar todos los usuarios</p>
                                </Link>

                                <Link
                                    href="/dashboard/admin/books"
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition group"
                                >
                                    <div className="text-4xl mb-3">📚</div>
                                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition">
                                        Gestionar Libros
                                    </h4>
                                    <p className="text-white/60 text-sm">Moderar y administrar libros</p>
                                </Link>

                                <Link
                                    href="/dashboard/admin/orders"
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition group"
                                >
                                    <div className="text-4xl mb-3">📦</div>
                                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition">
                                        Ver Órdenes
                                    </h4>
                                    <p className="text-white/60 text-sm">Revisar todas las órdenes</p>
                                </Link>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6">Actividad Reciente</h3>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <p className="text-white/60 text-center py-8">
                                    Las páginas de gestión detallada estarán disponibles próximamente
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
