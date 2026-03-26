'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    async function checkAuth() {
        try {
            // Check user session
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            console.log('User:', user)
            console.log('User Error:', userError)
            setUser(user)

            if (user) {
                // Check profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                console.log('Profile:', profile)
                console.log('Profile Error:', profileError)
                setProfile(profile)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8">Cargando...</div>
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold mb-8">🔍 Debug - Estado de Autenticación</h1>

            <div className="space-y-6">
                {/* User Session */}
                <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">👤 Sesión de Usuario</h2>
                    {user ? (
                        <div className="space-y-2 font-mono text-sm">
                            <p>✅ <strong>Autenticado</strong></p>
                            <p>ID: {user.id}</p>
                            <p>Email: {user.email}</p>
                            <p>Created: {new Date(user.created_at).toLocaleString()}</p>
                        </div>
                    ) : (
                        <p className="text-red-400">❌ No hay sesión activa</p>
                    )}
                </div>

                {/* Profile Data */}
                <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">📋 Perfil de Usuario</h2>
                    {profile ? (
                        <div className="space-y-2 font-mono text-sm">
                            <p>✅ <strong>Perfil encontrado</strong></p>
                            <p>Email: {profile.email}</p>
                            <p>Nombre: {profile.name || 'No definido'}</p>
                            <p>Teléfono: {profile.phone || 'No definido'}</p>
                            <p className="mt-4"><strong>Roles:</strong></p>
                            <div className="flex gap-2 mt-2">
                                {profile.roles?.map((role: string) => (
                                    <span key={role} className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-400">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : user ? (
                        <p className="text-yellow-400">⚠️ Usuario autenticado pero sin perfil</p>
                    ) : (
                        <p className="text-gray-400">No hay usuario autenticado</p>
                    )}
                </div>

                {/* Cookies */}
                <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">🍪 Cookies</h2>
                    <p className="text-sm text-white/60 mb-2">Cookies de autenticación:</p>
                    <pre className="bg-black/50 p-4 rounded text-xs overflow-auto">
                        {document.cookie || 'No hay cookies'}
                    </pre>
                </div>

                {/* Actions */}
                <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">🔧 Acciones</h2>
                    <div className="space-y-3">
                        <button
                            onClick={checkAuth}
                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition"
                        >
                            🔄 Recargar Estado
                        </button>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut()
                                window.location.href = '/login'
                            }}
                            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
                        >
                            🚪 Cerrar Sesión y Volver a Login
                        </button>
                        {profile?.roles?.includes('vendedor') && (
                            <button
                                onClick={() => window.location.href = '/dashboard/seller/sell'}
                                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition"
                            >
                                📖 Ir a Vender Libro
                            </button>
                        )}
                    </div>
                </div>

                {/* Diagnosis */}
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-yellow-400">💡 Diagnóstico</h2>
                    <div className="space-y-2 text-sm">
                        {!user && (
                            <p>❌ <strong>Problema:</strong> No hay sesión activa. Necesitas iniciar sesión.</p>
                        )}
                        {user && !profile && (
                            <p>⚠️ <strong>Problema:</strong> Sesión activa pero sin perfil en la BD. Verifica la tabla profiles.</p>
                        )}
                        {user && profile && !profile.roles?.includes('vendedor') && (
                            <p>⚠️ <strong>Problema:</strong> No tienes el rol de vendedor. Ejecuta el SQL para agregarlo.</p>
                        )}
                        {user && profile && profile.roles?.includes('vendedor') && (
                            <p>✅ <strong>Todo bien:</strong> Tienes sesión y rol de vendedor. Deberías poder acceder a /dashboard/seller/sell</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
