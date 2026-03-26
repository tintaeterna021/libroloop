'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AccountSettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()

            if (error) throw error
            if (!data) return

            setProfile(data)
            setName(data.name || '')
            setPhone(data.phone || '')
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        setMessage('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user')

            const { error } = await supabase
                .from('profiles')
                .update({ name, phone })
                .eq('id', user.id)

            if (error) throw error
            setMessage('Cambios guardados exitosamente')
            setTimeout(() => setMessage(''), 3000)
        } catch (error: any) {
            setMessage('Error al guardar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                    <p>Cargando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2">Configuración de Cuenta</h1>
                    <p className="text-white/60">Administra tu información personal</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg border ${message.includes('Error')
                        ? 'bg-red-500/10 border-red-500/50 text-red-400'
                        : 'bg-green-500/10 border-green-500/50 text-green-400'
                        }`}>
                        {message}
                    </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={profile?.email || ''}
                            disabled
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-white/40 mt-1">El email no se puede cambiar</p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                            placeholder="Tu nombre"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                            placeholder="+52 123 456 7890"
                        />
                    </div>

                    {/* Roles */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            Roles
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {profile?.roles?.map((role) => (
                                <span
                                    key={role}
                                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white text-sm"
                                >
                                    {role === 'comprador' ? '🛒 Comprador' :
                                        role === 'vendedor' ? '💼 Vendedor' :
                                            '⚙️ Admin'}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>

                {/* Logout */}
                <div className="mt-6 text-center">
                    <button
                        onClick={handleLogout}
                        className="text-red-400 hover:text-red-300 font-medium transition"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    )
}
