import { test, expect } from '@playwright/test'

test.describe('Business Layer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows store health metrics', async ({ page }) => {
    await expect(page.getByText('Salla Store Health')).toBeVisible()
    await expect(page.getByText('Orders Today')).toBeVisible()
    await expect(page.getByText('Revenue Today')).toBeVisible()
    await expect(page.getByText('Revenue MTD')).toBeVisible()
    await expect(page.getByText('Fulfillment Rate')).toBeVisible()
  })

  test('shows revenue numbers', async ({ page }) => {
    // Should show today's orders count
    await expect(page.getByText('47').first()).toBeVisible()
  })

  test('shows product performance table', async ({ page }) => {
    await expect(page.getByText('Product Performance')).toBeVisible()
    await expect(page.getByText('USB-C Hub 7-in-1')).toBeVisible()
    await expect(page.getByText('Wireless Charger Pro')).toBeVisible()
    await expect(page.getByText('ALM-004').first()).toBeVisible()
  })

  test('shows customer pulse section', async ({ page }) => {
    await expect(page.getByText('Customer Pulse')).toBeVisible()
    await expect(page.getByText('avg rating')).toBeVisible()
    await expect(page.getByText('total reviews')).toBeVisible()
    await expect(page.getByText('open tickets')).toBeVisible()
  })

  test('shows recent reviews', async ({ page }) => {
    await expect(page.getByText('Excellent quality, fast delivery!')).toBeVisible()
  })

  test('shows financial snapshot', async ({ page }) => {
    await expect(page.getByText('Financial Snapshot')).toBeVisible()
    await expect(page.getByText('Cash Position').first()).toBeVisible()
    await expect(page.getByText('Monthly Burn')).toBeVisible()
    await expect(page.getByText('Gross Margin')).toBeVisible()
  })

  test('shows active blockers', async ({ page }) => {
    await expect(page.getByText('Active Blockers')).toBeVisible()
    await expect(page.getByText(/Salla coupon SAVE20 expired/)).toBeVisible()
    await expect(page.getByText('critical').first()).toBeVisible()
  })

  test('shows 7-day revenue chart', async ({ page }) => {
    await expect(page.getByText('7-Day Revenue Trend')).toBeVisible()
    // Recharts renders SVG
    await expect(page.locator('svg').first()).toBeVisible()
  })
})
