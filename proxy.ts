import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
    let res = NextResponse.next({ request: req })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
                    res = NextResponse.next({ request: req })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        res.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Only check if user is authenticated — no extra DB queries
    const { data: { user } } = await supabase.auth.getUser()

    const url = req.nextUrl.clone()

    if (!user) {
        // Not logged in → redirect to login for protected routes
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // User is authenticated → allow access
    // Role-based checks are handled client-side in Navigation.tsx
    return res
}

export const config = {
    matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}
