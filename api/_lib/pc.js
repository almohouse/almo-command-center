/**
 * Shared Paperclip API helpers for Vercel Serverless Functions.
 *
 * IMPORTANT — Localhost vs Cloud:
 * The default PAPERCLIP_API_URL must NOT be a localhost address on Vercel.
 * Vercel cannot reach 127.0.0.1:3100.
 *
 * To connect to a live Paperclip instance, set these env vars in the Vercel dashboard:
 *   PAPERCLIP_API_URL  — the public URL of your Paperclip instance
 *   PAPERCLIP_API_KEY  — your API key
 *   PAPERCLIP_COMPANY_ID — your company ID
 *
 * If PAPERCLIP_API_URL is not configured (or is a localhost URL), all pcGet/pcPost/pcPatch
 * calls will throw a PAPERCLIP_UNAVAILABLE error. The serverless functions catch this
 * and return mock/empty data so the frontend loads gracefully.
 */

const _apiUrl = process.env.PAPERCLIP_API_URL || ''
const _isLocalhost = _apiUrl.includes('localhost') || _apiUrl.includes('127.0.0.1') || _apiUrl.includes('0.0.0.0')
export const PAPERCLIP_CONFIGURED = _apiUrl.length > 0 && !_isLocalhost

export const PAPERCLIP_API_URL = _apiUrl
export const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY || ''
export const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID || '979e46be-09ac-4f35-b575-1cb2074e4d57'

function assertConfigured() {
  if (!PAPERCLIP_CONFIGURED) {
    const err = new Error(
      'Paperclip API is not configured for cloud access. ' +
      'Set PAPERCLIP_API_URL (must be a public URL, not localhost) in the Vercel dashboard.'
    )
    err.code = 'PAPERCLIP_UNAVAILABLE'
    throw err
  }
}

export function pcHeaders() {
  return {
    Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function pcGet(path) {
  assertConfigured()
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${PAPERCLIP_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Paperclip ${path}: ${res.status}`)
  return res.json()
}

export async function pcPost(path, body) {
  assertConfigured()
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    method: 'POST',
    headers: pcHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Paperclip POST ${path}: ${res.status}`)
  return res.json()
}

export async function pcPatch(path, body) {
  assertConfigured()
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    method: 'PATCH',
    headers: pcHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Paperclip PATCH ${path}: ${res.status}`)
  return res.json()
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }
}

/** True if the error means Paperclip is unconfigured/unreachable (safe to degrade gracefully). */
export function isUnavailable(err) {
  return err?.code === 'PAPERCLIP_UNAVAILABLE' ||
    err?.message?.includes('PAPERCLIP_UNAVAILABLE') ||
    err?.message?.includes('ECONNREFUSED') ||
    err?.message?.includes('fetch failed')
}
