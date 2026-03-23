import { test, expect } from '@playwright/test'

const MOCK_GOALS = {
  goals: [
    { id: 'okr-chiefs', title: 'Reach 8 Chiefs live', description: 'North Star: full executive team', current: 5, target: 8, unit: 'chiefs', status: 'in_progress', source: 'live' },
    { id: 'okr-revenue', title: 'Monthly Revenue SAR 400K', description: 'Break SAR 400K GMV', current: 284560, target: 400000, unit: 'SAR', status: 'in_progress', source: 'mock' },
    { id: 'okr-agents', title: 'Deploy 20 active agents', description: 'All functional roles covered', current: 16, target: 20, unit: 'agents', status: 'in_progress', source: 'live' },
    { id: 'okr-velocity', title: 'Ship 50 tasks per month', description: 'Maintain high delivery velocity', current: 52, target: 50, unit: 'tasks', status: 'done', source: 'live' },
  ],
  agentCount: 16,
  activeChiefs: 5,
}

test.describe('Strategy View', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/goals', (route) => route.fulfill({ json: MOCK_GOALS }))
    await page.goto('/strategy')
  })

  test('shows OKR tracking with live data', async ({ page }) => {
    await expect(page.getByText('OKR Tracking')).toBeVisible()
    // Live data from Paperclip — wait for goals to load
    await expect(page.getByText('Reach 8 Chiefs live')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Monthly Revenue SAR 400K')).toBeVisible()
  })

  test('shows LIVE badge on live-sourced OKRs', async ({ page }) => {
    await page.waitForSelector('[class*="accent-green"]', { timeout: 10000 })
    await expect(page.getByText('LIVE').first()).toBeVisible()
  })

  test('shows product roadmap with editable items', async ({ page }) => {
    await expect(page.getByText('Product Roadmap')).toBeVisible()
    await expect(page.getByText('Q1 2026')).toBeVisible()
    await expect(page.getByText('Q2 2026')).toBeVisible()
    // Edit pencil buttons should be present
    const editBtns = page.locator('button').filter({ has: page.locator('svg') })
    await expect(editBtns.first()).toBeVisible()
  })

  test('roadmap item is editable', async ({ page }) => {
    await expect(page.getByText('Q1 2026')).toBeVisible()
    // Click first pencil icon to open edit mode
    const pencilBtns = page.locator('button[class*="text-text-muted"]').first()
    await pencilBtns.click()
    // Edit inputs should appear
    await expect(page.locator('select option[value="in_progress"]')).toBeAttached()
  })

  test('shows north star tracker with live agent count', async ({ page }) => {
    await expect(page.getByText('North Star Tracker')).toBeVisible()
    // Shows live count from Paperclip (not hardcoded 3)
    await expect(page.locator('p.text-3xl')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('p.text-3xl')).not.toContainText('…')
  })

  test('shows agent count in north star subtitle', async ({ page }) => {
    await expect(page.getByText(/total agents/)).toBeVisible({ timeout: 10000 })
  })
})
