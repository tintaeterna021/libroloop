/**
 * Meta Conversions API — server-side utility
 *
 * Runs ONLY on the server (Node.js runtime).
 * Uses the native `crypto` module — no extra dependencies.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import { createHash } from 'crypto'

const PIXEL_ID = process.env.META_PIXEL_ID!
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!
const API_VERSION = 'v20.0'
const ENDPOINT = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`

// ── Helpers ────────────────────────────────────────────────────────────────

/** SHA-256 hash a string value. Returns empty string if value is falsy. */
function sha256(value: string | undefined | null): string {
  if (!value) return ''
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

/** Normalise a Mexican phone number to E.164 format before hashing. */
function normalisePhone(phone: string | undefined | null): string {
  if (!phone) return ''
  // Strip everything that isn't a digit
  const digits = phone.replace(/\D/g, '')
  // Prepend country code if not already present
  if (digits.length === 10) return `52${digits}`
  if (digits.startsWith('52') && digits.length === 12) return digits
  return digits
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MetaUserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  /** Client IP address (from request headers) */
  clientIp?: string
  /** User-Agent header */
  userAgent?: string
  /** Facebook click ID (_fbc cookie) */
  fbc?: string
  /** Facebook browser ID (_fbp cookie) */
  fbp?: string
}

export interface MetaCustomData {
  /** Total value of the event (e.g. order total) */
  value?: number
  currency?: string
  /** Order / content ID */
  orderId?: string
  contentIds?: string[]
  contentType?: string
  contentName?: string
  numItems?: number
}

export interface SendMetaEventOptions {
  /** Event name, e.g. "Purchase", "AddToCart", "ViewContent" */
  eventName: string
  /** ISO timestamp (seconds since epoch). Defaults to now. */
  eventTime?: number
  /**
   * A unique ID for this event shared between the browser pixel
   * and this server call — used by Meta for deduplication.
   */
  eventId?: string
  /** Full URL where the event occurred */
  eventSourceUrl?: string
  userData?: MetaUserData
  customData?: MetaCustomData
  /** Meta test event code (only set in dev/staging) */
  testEventCode?: string
}

// ── Core function ──────────────────────────────────────────────────────────

export async function sendMetaEvent(options: SendMetaEventOptions): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[Meta CAPI] Missing META_PIXEL_ID or META_ACCESS_TOKEN — skipping.')
    return
  }

  const {
    eventName,
    eventTime = Math.floor(Date.now() / 1000),
    eventId,
    eventSourceUrl,
    userData = {},
    customData = {},
    testEventCode,
  } = options

  const [firstName, ...rest] = (userData.firstName ?? '').split(' ')
  const lastName = userData.lastName ?? rest.join(' ') ?? ''

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        action_source: 'website',
        ...(eventId && { event_id: eventId }),
        ...(eventSourceUrl && { event_source_url: eventSourceUrl }),
        user_data: {
          ...(userData.email && { em: sha256(userData.email) }),
          ...(userData.phone && { ph: sha256(normalisePhone(userData.phone)) }),
          ...(firstName && { fn: sha256(firstName) }),
          ...(lastName && { ln: sha256(lastName) }),
          ...(userData.clientIp && { client_ip_address: userData.clientIp }),
          ...(userData.userAgent && { client_user_agent: userData.userAgent }),
          ...(userData.fbc && { fbc: userData.fbc }),
          ...(userData.fbp && { fbp: userData.fbp }),
        },
        ...(Object.keys(customData).length > 0 && {
          custom_data: {
            ...(customData.value !== undefined && { value: customData.value }),
            ...(customData.currency && { currency: customData.currency }),
            ...(customData.orderId && { order_id: customData.orderId }),
            ...(customData.contentIds && { content_ids: customData.contentIds }),
            ...(customData.contentType && { content_type: customData.contentType }),
            ...(customData.contentName && { content_name: customData.contentName }),
            ...(customData.numItems !== undefined && { num_items: customData.numItems }),
          },
        }),
      },
    ],
    ...(testEventCode && { test_event_code: testEventCode }),
  }

  try {
    const res = await fetch(`${ENDPOINT}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[Meta CAPI] HTTP ${res.status}:`, body)
    } else {
      const data = await res.json()
      console.log(`[Meta CAPI] ✓ ${eventName} sent — events_received: ${data?.events_received}`)
    }
  } catch (err) {
    // Never throw — CAPI errors must not break the checkout flow
    console.error('[Meta CAPI] Fetch error:', err)
  }
}
