import { test, expect } from '@playwright/test'

test.describe('Council Meeting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/council')
  })

  test('renders council meeting page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Council Meeting')
    await expect(page.getByText('Live agent feed')).toBeVisible()
  })

  test('shows live/offline status indicator', async ({ page }) => {
    // Either "Live" or "Offline" status badge should be visible
    const statusBadge = page.locator('text=Live, text=Offline').first()
    // Check the indicator container exists
    await expect(page.locator('[class*="rounded-full"]').filter({ hasText: /Live|Offline/ }).first()).toBeVisible()
  })

  test('shows Start Meeting button when no session active', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Start Meeting/i })).toBeVisible()
  })

  test('starts meeting when clicking Start Meeting', async ({ page }) => {
    await page.route('**/api/council/start', route =>
      route.fulfill({ json: { status: 'started', session: { active: true, startedAt: new Date().toISOString() } } })
    )
    await page.route('**/api/council/messages', route =>
      route.fulfill({ json: { session: { active: false, startedAt: null }, messages: [] } })
    )

    await page.getByRole('button', { name: /Start Meeting/i }).click()
    await expect(page.getByRole('button', { name: /End Meeting/i })).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('Council meeting started')).toBeVisible()
  })

  test('shows message input during active session', async ({ page }) => {
    await page.route('**/api/council/start', route =>
      route.fulfill({ json: { status: 'started', session: { active: true, startedAt: new Date().toISOString() } } })
    )
    await page.route('**/api/council/messages', route =>
      route.fulfill({ json: { session: { active: false, startedAt: null }, messages: [] } })
    )

    await page.getByRole('button', { name: /Start Meeting/i }).click()
    await expect(page.getByRole('button', { name: /End Meeting/i })).toBeVisible({ timeout: 3000 })

    const input = page.getByPlaceholder(/Add to the discussion/i)
    await expect(input).toBeEnabled()
  })

  test('can type and send a message in active session', async ({ page }) => {
    await page.route('**/api/council/start', route =>
      route.fulfill({ json: { status: 'started', session: { active: true, startedAt: new Date().toISOString() } } })
    )
    await page.route('**/api/council/messages', route =>
      route.fulfill({ json: { session: { active: false, startedAt: null }, messages: [] } })
    )

    await page.getByRole('button', { name: /Start Meeting/i }).click()
    await expect(page.getByRole('button', { name: /End Meeting/i })).toBeVisible({ timeout: 3000 })

    const input = page.getByPlaceholder(/Add to the discussion/i)
    await input.fill('Test message from Moe')
    await input.press('Enter')

    // Message should appear in the chat
    await expect(page.getByText('Test message from Moe')).toBeVisible()
  })

  test('shows Minutes of Meeting panel', async ({ page }) => {
    await expect(page.getByText('Minutes of Meeting')).toBeVisible()
  })

  test('generates MoM when meeting ends', async ({ page }) => {
    await page.route('**/api/council/start', route =>
      route.fulfill({ json: { status: 'started', session: { active: true, startedAt: new Date().toISOString() } } })
    )
    await page.route('**/api/council/messages', route =>
      route.fulfill({ json: { session: { active: false, startedAt: null }, messages: [] } })
    )
    await page.route('**/api/council/end', route =>
      route.fulfill({
        json: {
          status: 'ended',
          mom: '## Minutes of Meeting — Monday, March 23, 2026\n\n**Participants:** None\n**Duration:** 0 minutes',
          postedIssueIdentifier: null,
        },
      })
    )

    await page.getByRole('button', { name: /Start Meeting/i }).click()
    await expect(page.getByRole('button', { name: /End Meeting/i })).toBeVisible({ timeout: 3000 })
    await page.getByRole('button', { name: /End Meeting/i }).click()

    await expect(page.getByText(/Minutes of Meeting — /)).toBeVisible({ timeout: 5000 })
  })

  test('message input disabled when no session', async ({ page }) => {
    await page.route('**/api/council/messages', route =>
      route.fulfill({ json: { session: { active: false, startedAt: null }, messages: [] } })
    )

    const input = page.getByPlaceholder(/Start a meeting to participate/i)
    await expect(input).toBeDisabled()
  })
})
