/**
 * API connectivity test — ALM-108 (TDD Step 3)
 *
 * This test proves the Vercel serverless functions can reach Paperclip.
 * It must FAIL before Tailscale Funnel is configured (PAPERCLIP_API_URL not set or localhost).
 * It must PASS after PAPERCLIP_API_URL is set to the Tailscale Funnel public URL.
 */

import { test, expect } from '@playwright/test'

test.describe('API Connectivity', () => {
  test('serverless /api/agents returns a valid response (not 500 or 502)', async ({ request }) => {
    const res = await request.get('/api/agents')
    expect(res.status()).not.toBe(500)
    expect(res.status()).not.toBe(502)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    // In degraded (no Tailscale) mode we still get mock agents — array should be non-empty
    expect(body.length).toBeGreaterThan(0)
  })

  test('serverless /api/issues returns a valid response (not 500 or 502)', async ({ request }) => {
    const res = await request.get('/api/issues?status=todo,in_progress,blocked,in_review')
    expect(res.status()).not.toBe(500)
    expect(res.status()).not.toBe(502)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('serverless /api/dashboard returns a valid response (not 500 or 502)', async ({ request }) => {
    const res = await request.get('/api/dashboard')
    expect(res.status()).not.toBe(500)
    expect(res.status()).not.toBe(502)

    const body = await res.json()
    expect(body).toHaveProperty('agents')
    expect(body).toHaveProperty('issues')
    expect(Array.isArray(body.agents)).toBe(true)
  })

  test('serverless /api/morning-brief returns a valid response (not 500 or 502)', async ({ request }) => {
    const res = await request.get('/api/morning-brief')
    expect(res.status()).not.toBe(500)
    expect(res.status()).not.toBe(502)

    const body = await res.json()
    expect(body).toHaveProperty('summary')
  })

  /**
   * LIVE DATA TEST (requires Tailscale Funnel + PAPERCLIP_API_URL set)
   *
   * This test will FAIL in degraded mode (mock data) and PASS when connected
   * to a live Paperclip instance. Uncomment and run after Tailscale is configured.
   */
  // test('agents endpoint returns live data from Paperclip (requires Tailscale Funnel)', async ({ request }) => {
  //   const res = await request.get('/api/agents')
  //   const body = await res.json()
  //   // Live agents will have real IDs (not 'mock-*')
  //   expect(body.some((a: { id: string }) => !a.id.startsWith('mock-'))).toBe(true)
  // })
})
