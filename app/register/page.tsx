'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { migrateGuestCartToUser } from '@/lib/cart'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const pwStrength = (pw: string): { score: number; label: string; color: string } => {
        let score = 0
        if (pw.length >= 8) score++
        if (/[A-Z]/.test(pw)) score++
        if (/[0-9]/.test(pw)) score++
        if (/[^A-Za-z0-9]/.test(pw)) score++
        const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte']
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'] // Tailwind colors
        return { score, label: labels[score], color: colors[score] }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
            setError('Ingresa un correo válido')
            setLoading(false)
            return
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            setLoading(false)
            return
        }

        // Validate password strength
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres')
            setLoading(false)
            return
        }
        if (!/[A-Z]/.test(password)) {
            setError('La contraseña debe incluir al menos una mayúscula')
            setLoading(false)
            return
        }
        if (!/[0-9]/.test(password)) {
            setError('La contraseña debe incluir al menos un número')
            setLoading(false)
            return
        }

        try {
            // Create user in Supabase Auth
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (signUpError) {
                if (signUpError.message.toLowerCase().includes('already') ||
                    signUpError.message.toLowerCase().includes('registered')) {
                    throw new Error('Este correo ya está registrado. ¿Ya tienes cuenta? Inicia sesión.')
                }
                throw signUpError
            }

            if (authData.user) {
                // Wait for trigger to create profile
                await new Promise(resolve => setTimeout(resolve, 1000))

                // Update profile with name
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ name })
                    .eq('id', authData.user.id)

                if (profileError) {
                    console.error('Profile update error:', profileError)
                }

                // Migrate guest cart to user cart
                try {
                    await migrateGuestCartToUser(supabase, authData.user.id)
                } catch (cartError) {
                    console.error('Cart migration error:', cartError)
                }

                // Redirect to books catalog
                router.push('/')
            }
        } catch (err: any) {
            setError(err.message || 'Error al crear la cuenta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-black tracking-tighter text-white mb-2">
                        LIBROLOOP
                    </h1>
                    <p className="text-white/40 font-mono text-sm uppercase tracking-widest">
                        Crear Nueva Cuenta
                    </p>
                </div>

                {/* Register Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Registro</h2>
                        <p className="text-white/50 text-sm">
                            Crea tu cuenta para comprar libros
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        {/* Name Input */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
                                Nombre Completo
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition"
                                placeholder="Juan Pérez"
                            />
                        </div>

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition"
                                placeholder="tu@email.com"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition"
                                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                            />
                            {password.length > 0 && (() => {
                                const s = pwStrength(password)
                                return (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300" style={{ backgroundColor: i <= s.score ? s.color : 'rgba(255,255,255,0.1)' }} />
                                            ))}
                                        </div>
                                        <p className="text-xs font-semibold m-0" style={{ color: s.color }}>{s.label}</p>
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    <span>Creando cuenta...</span>
                                </>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-6 text-center">
                        <p className="text-white/40 text-sm">
                            ¿Ya tienes cuenta?{' '}
                            <a href="/login" className="text-white hover:underline font-medium">
                                Inicia sesión aquí
                            </a>
                        </p>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-white/60 text-xs text-center leading-relaxed">
                        Al registrarte, podrás comprar libros. Si quieres vender, podrás activar el modo vendedor desde tu perfil.
                    </p>
                </div>
            </div>
        </div>
    )
}
