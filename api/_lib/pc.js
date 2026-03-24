/**
 * Shared Paperclip API helpers for Vercel Serverless Functions.
 * Mirrors the logic in server/index.js but is designed for Vercel's edge environment.
 */

export const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3100'
export const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY || ''
export const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID || '979e46be-09ac-4f35-b575-1cb2074e4d57'

export function pcHeaders() {
  return {
    Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function pcGet(path) {
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${PAPERCLIP_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Paperclip ${path}: ${res.status}`)
  return res.json()
}

export async function pcPost(path, body) {
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    method: 'POST',
    headers: pcHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Paperclip POST ${path}: ${res.status}`)
  return res.json()
}

export async function pcPatch(path, body) {
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
