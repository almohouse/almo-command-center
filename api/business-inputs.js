/**
 * In-memory business inputs store for Vercel Serverless Functions.
 * Note: Vercel functions are stateless — data will not persist across requests.
 * For persistence, integrate a database (e.g. Vercel KV, PlanetScale) later.
 */
import { corsHeaders } from './_lib/pc.js'

// Module-level store — shared within the same function instance only
const store = {
  expenses: [],
  shipments: [],
  inventory: [],
}

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  const url = new URL(req.url, `http://${req.headers.host}`)
  const subpath = url.pathname.replace(/^\/api\/business-inputs\/?/, '')

  if (req.method === 'GET' && !subpath) {
    return res.status(200).json(store)
  }

  if (req.method === 'POST' && subpath === 'expenses') {
    const { description, amount, category, date } = req.body || {}
    if (!description || !amount) return res.status(400).json({ error: 'description and amount required' })
    const entry = { id: `exp-${Date.now()}`, description, amount: parseFloat(amount), category: category || 'General', date: date || new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() }
    store.expenses.unshift(entry)
    return res.status(201).json(entry)
  }

  if (req.method === 'POST' && subpath === 'shipments') {
    const { orderId, carrier, status, eta, notes } = req.body || {}
    if (!orderId) return res.status(400).json({ error: 'orderId required' })
    const entry = { id: `shp-${Date.now()}`, orderId, carrier: carrier || 'Unknown', status: status || 'in_transit', eta: eta || null, notes: notes || '', createdAt: new Date().toISOString() }
    store.shipments.unshift(entry)
    return res.status(201).json(entry)
  }

  if (req.method === 'POST' && subpath === 'inventory') {
    const { sku, productName, change, reason } = req.body || {}
    if (!sku || change === undefined) return res.status(400).json({ error: 'sku and change required' })
    const entry = { id: `inv-${Date.now()}`, sku, productName: productName || sku, change: parseInt(change), reason: reason || '', createdAt: new Date().toISOString() }
    store.inventory.unshift(entry)
    return res.status(201).json(entry)
  }

  res.status(404).json({ error: 'Not found' })
}
