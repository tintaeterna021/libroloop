'use client'

/**
 * useMetaEvent — client-side hook for Meta event tracking.
 *
 * Fires BOTH the browser pixel (via window.fbq) AND the Conversions API
 * (via /api/meta-event) with the SAME event_id for deduplication.
 *
 * Usage:
 *   const { trackEvent } = useMetaEvent()
 *   trackEvent('AddToCart', { value: 199, currency: 'MXN', contentIds: ['book-id'] })
 */

import { useCallback } from 'react'

export interface MetaEventData {
  value?: number
  currency?: string
  contentIds?: string[]
  contentType?: string
  contentName?: string
  numItems?: number
  orderId?: string
  /** User email — will be hashed server-side */
  email?: string
  /** User phone — will be hashed server-side */
  phone?: string
  firstName?: string
  lastName?: string
}

/** Generate a random event ID for deduplication between pixel and CAPI */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function useMetaEvent() {
  const trackEvent = useCallback(
    async (eventName: string, data: MetaEventData = {}) => {
      const eventId = generateEventId()
      const eventSourceUrl = typeof window !== 'undefined' ? window.location.href : undefined

      // 1. Fire browser pixel for immediate attribution
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        const pixelData: Record<string, unknown> = {}
        if (data.value !== undefined) pixelData['value'] = data.value
        if (data.currency) pixelData['currency'] = data.currency
        if (data.contentIds) pixelData['content_ids'] = data.contentIds
        if (data.contentType) pixelData['content_type'] = data.contentType
        if (data.contentName) pixelData['content_name'] = data.contentName
        if (data.numItems !== undefined) pixelData['num_items'] = data.numItems
        if (data.orderId) pixelData['order_id'] = data.orderId

        try {
          window.fbq('track', eventName, pixelData, { eventID: eventId })
        } catch (e) {
          console.warn('[Meta Pixel] fbq error:', e)
        }
      }

      // 2. Fire CAPI server-side in parallel (fire-and-forget)
      try {
        await fetch('/api/meta-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName,
            eventId,
            eventSourceUrl,
            userData: {
              email: data.email,
              phone: data.phone,
              firstName: data.firstName,
              lastName: data.lastName,
            },
            customData: {
              value: data.value,
              currency: data.currency ?? 'MXN',
              contentIds: data.contentIds,
              contentType: data.contentType ?? 'product',
              contentName: data.contentName,
              numItems: data.numItems,
              orderId: data.orderId,
            },
          }),
        })
      } catch (err) {
        // Silently ignore — never block user flow
        console.warn('[Meta CAPI] Request failed:', err)
      }
    },
    []
  )

  return { trackEvent }
}
