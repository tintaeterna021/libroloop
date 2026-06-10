/**
 * POST /api/meta-event
 *
 * Proxy endpoint that receives event data from client components
 * and forwards it to Meta's Conversions API using the server-side token.
 *
 * The access token never reaches the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendMetaEvent, type SendMetaEventOptions } from '@/lib/meta-capi'

export async function POST(req: NextRequest) {
  try {
    const body: SendMetaEventOptions = await req.json()

    // Enrich userData with real client IP and User-Agent from request headers
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      undefined

    const userAgent = req.headers.get('user-agent') ?? undefined

    // Extract _fbc and _fbp from cookies if not provided by client
    const cookies = req.headers.get('cookie') ?? ''
    const fbc = body.userData?.fbc ?? parseCookie(cookies, '_fbc')
    const fbp = body.userData?.fbp ?? parseCookie(cookies, '_fbp')

    await sendMetaEvent({
      ...body,
      userData: {
        ...body.userData,
        clientIp,
        userAgent,
        fbc,
        fbp,
      },
      // Optionally propagate test event code in dev
      testEventCode: process.env.META_TEST_EVENT_CODE,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/meta-event] Error:', err)
    // Return 200 so the client never blocks on this
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 })
  }
}

function parseCookie(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}
