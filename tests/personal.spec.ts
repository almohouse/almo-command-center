import { test, expect } from '@playwright/test'

test.describe("Moe's Personal Layer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/personal')
  })

  test('renders Personal view with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText("Moe's Personal Layer")
    await expect(page.getByText(/Morning brief.*Vault search.*Travel ready/i)).toBeVisible()
  })

  test('shows Morning Brief and Vault Search tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Morning Brief' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vault Search' })).toBeVisible()
  })

  test('Morning Brief tab is active by default', async ({ page }) => {
    const briefBtn = page.getByRole('button', { name: 'Morning Brief' })
    await expect(briefBtn).toHaveClass(/text-accent-blue/)
  })

  test('shows morning brief content', async ({ page }) => {
    await page.route('**/api/morning-brief', route =>
      route.fulfill({
        json: {
          date: 'Monday, March 23, 2026',
          generatedAt: new Date().toISOString(),
          summary: { onlineAgents: 3, totalAgents: 8, blockedCount: 2, inProgressCount: 5, criticalCount: 1 },
          topBlockers: [
            { id: '1', identifier: 'ALM-55', title: 'Fix payment gateway', priority: 'critical' },
          ],
          activeAgents: [{ name: 'CTO', task: 'ALM-61' }, { name: 'CMO', task: null }],
          revenue: { today: 18420, mtd: 284560, target: 400000, currency: 'SAR' },
        },
      })
    )
    await page.reload()

    await expect(page.getByText('Good Morning, Moe')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('3/8')).toBeVisible()
    await expect(page.getByText('Agents Online')).toBeVisible()
    await expect(page.getByText('Top Blockers')).toBeVisible()
    await expect(page.getByText('ALM-55')).toBeVisible()
    await expect(page.getByText('Active Agents')).toBeVisible()
    await expect(page.getByText('CTO')).toBeVisible()
  })

  test('shows revenue progress bar in morning brief', async ({ page }) => {
    await page.route('**/api/morning-brief', route =>
      route.fulfill({
        json: {
          date: 'Monday, March 23, 2026',
          generatedAt: new Date().toISOString(),
          summary: { onlineAgents: 3, totalAgents: 8, blockedCount: 0, inProgressCount: 5, criticalCount: 0 },
          topBlockers: [],
          activeAgents: [],
          revenue: { today: 18420, mtd: 284560, target: 400000, currency: 'SAR' },
        },
      })
    )
    await page.reload()

    await expect(page.getByText('Revenue')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/% of SAR/)).toBeVisible()
  })

  test('switches to Vault Search tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Vault Search' }).click()
    await expect(page.getByPlaceholder(/Search issues, tasks/i)).toBeVisible()
  })

  test('vault search input accepts text', async ({ page }) => {
    await page.getByRole('button', { name: 'Vault Search' }).click()
    const input = page.getByPlaceholder(/Search issues, tasks/i)
    await input.fill('payment gateway')
    await expect(input).toHaveValue('payment gateway')
  })

  test('vault search shows results', async ({ page }) => {
    await page.route('**/api/vault/search*', route =>
      route.fulfill({
        json: {
          query: 'payment',
          total: 2,
          results: [
            {
              id: '1', identifier: 'ALM-55', title: 'Fix payment gateway timeout',
              status: 'blocked', priority: 'critical',
              excerpt: 'Payment gateway is timing out on large orders',
              updatedAt: new Date().toISOString(), type: 'issue',
            },
            {
              id: '2', identifier: 'ALM-48', title: 'Payment flow UX improvements',
              status: 'todo', priority: 'medium',
              excerpt: 'Improve the checkout flow for better conversion',
              updatedAt: new Date().toISOString(), type: 'issue',
            },
          ],
        },
      })
    )

    await page.getByRole('button', { name: 'Vault Search' }).click()
    const input = page.getByPlaceholder(/Search issues, tasks/i)
    await input.fill('payment')
    await page.waitForTimeout(600)

    await expect(page.getByText('2 results')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Fix payment gateway timeout')).toBeVisible()
    await expect(page.getByText('Payment flow UX improvements')).toBeVisible()
  })

  test('vault search shows no results message', async ({ page }) => {
    await page.route('**/api/vault/search*', route =>
      route.fulfill({ json: { query: 'xyznothing', total: 0, results: [] } })
    )

    await page.getByRole('button', { name: 'Vault Search' }).click()
    const input = page.getByPlaceholder(/Search issues, tasks/i)
    await input.fill('xyznothing')
    await page.waitForTimeout(600)

    await expect(page.getByText(/No results for/)).toBeVisible({ timeout: 5000 })
  })

  test('clear button appears when vault search has text', async ({ page }) => {
    await page.getByRole('button', { name: 'Vault Search' }).click()
    const input = page.getByPlaceholder(/Search issues, tasks/i)
    await input.fill('test query')
    // Clear button (X) should appear
    const clearBtn = page.locator('input + button, button:has(svg)').last()
    await expect(clearBtn).toBeVisible()
  })
})

test.describe('Travel Mode', () => {
  test('travel mode toggle is visible in top bar', async ({ page }) => {
    await page.goto('/')
    // Smartphone or Monitor icon button should be in the header
    const travelBtn = page.locator('header button[title*="Travel"], header button[title*="Desktop"]')
    await expect(travelBtn).toBeVisible()
  })

  test('activates travel mode when toggle is clicked', async ({ page }) => {
    await page.goto('/')
    const travelBtn = page.locator('header button[title*="Travel Mode"]')
    await travelBtn.click()
    // Should now show Monitor icon (desktop mode button)
    await expect(page.locator('header button[title*="Desktop"]')).toBeVisible()
    // Sidebar should be hidden in travel mode
    await expect(page.locator('aside')).not.toBeVisible()
  })

  test('deactivates travel mode when toggle clicked again', async ({ page }) => {
    await page.goto('/')
    const travelBtn = page.locator('header button[title*="Travel Mode"]')
    await travelBtn.click()
    await page.locator('header button[title*="Desktop"]').click()
    // Sidebar should return
    await expect(page.locator('aside')).toBeVisible()
  })
})
