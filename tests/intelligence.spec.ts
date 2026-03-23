import { test, expect } from '@playwright/test'

const MOCK_INTELLIGENCE = {
  anomalies: [
    { id: 'a1', type: 'agent', title: 'All systems nominal — no anomalies detected', time: 'Now', severity: 'info' },
  ],
  risks: [
    { id: 'r1', title: 'Cash runway below 4 months', severity: 'high', countdown: '31 days', mitigation: 'Increase revenue or reduce burn rate' },
    { id: 'r2', title: 'USB-C Hub stock critical', severity: 'critical', countdown: '5 days', mitigation: 'Reorder from supplier immediately' },
  ],
}

test.describe('Intelligence View', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/intelligence', (route) => route.fulfill({ json: MOCK_INTELLIGENCE }))
    await page.goto('/intelligence')
  })

  test('renders anomaly detection section', async ({ page }) => {
    await expect(page.getByText('Anomaly Detection')).toBeVisible()
    await expect(page.getByText(/live Paperclip data/i)).toBeVisible()
  })

  test('loads anomaly cards from API', async ({ page }) => {
    await expect(page.getByText('All systems nominal')).toBeVisible({ timeout: 5000 })
  })

  test('shows refresh button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible()
  })

  test('renders risk radar section', async ({ page }) => {
    await expect(page.getByText('Risk Radar')).toBeVisible()
    await expect(page.getByText(/blocked tasks/i)).toBeVisible()
  })

  test('shows risk items with mitigation text', async ({ page }) => {
    await expect(page.getByText(/Increase revenue/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Reorder from supplier/)).toBeVisible()
  })

  test('shows risk severity badges', async ({ page }) => {
    await expect(page.getByText('high').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('critical').first()).toBeVisible()
  })

  test('competitive pulse has API hook placeholder', async ({ page }) => {
    await expect(page.getByText('Competitive Pulse')).toBeVisible()
    await expect(page.getByText('API_HOOK: /api/intelligence/competitive')).toBeVisible()
  })

  test('opportunity scanner has API hook placeholder', async ({ page }) => {
    await expect(page.getByText('Opportunity Scanner')).toBeVisible()
    await expect(page.getByText('API_HOOK: /api/intelligence/opportunities')).toBeVisible()
  })
})
