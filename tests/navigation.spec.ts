import { test, expect, type BrowserContext, type Page } from '@playwright/test'

async function installDeterministicAuthState(context: BrowserContext) {
  await context.clearCookies()
  await context.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('almo_cc_auth', 'true')
  })
}

async function openAuthenticatedApp(page: Page) {
  await installDeterministicAuthState(page.context())
  await page.goto('/')
}

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await openAuthenticatedApp(page)
  })

  test('loads the Business view by default', async ({ page }) => {
    await expect(page).toHaveTitle(/ALMO Command Center/)
    await expect(page.locator('h1')).toContainText('Business')
  })

  test('sidebar has all 8 nav items', async ({ page }) => {
    const navItems = ['Business', 'OS', 'Intelligence', 'Strategy', 'Cockpit', 'Council', 'Founder', 'Personal']
    for (const item of navItems) {
      await expect(page.getByRole('link', { name: item })).toBeVisible()
    }
  })

  test('navigates to OS layer', async ({ page }) => {
    await page.getByRole('link', { name: 'OS' }).click()
    await expect(page.locator('h1')).toContainText('OS Layer')
    await expect(page.getByText('Agent Performance Matrix')).toBeVisible()
  })

  test('navigates to Intelligence', async ({ page }) => {
    await page.getByRole('link', { name: 'Intelligence' }).click()
    await expect(page.locator('h1')).toContainText('Intelligence')
    await expect(page.getByText('Anomaly Detection')).toBeVisible()
  })

  test('navigates to Strategy', async ({ page }) => {
    await page.getByRole('link', { name: 'Strategy' }).click()
    await expect(page.locator('h1')).toContainText('Strategy')
    await expect(page.getByText('OKR Tracking')).toBeVisible()
  })

  test('navigates to Cockpit', async ({ page }) => {
    await page.getByRole('link', { name: 'Cockpit' }).click()
    await expect(page.locator('h1')).toContainText('Decision Cockpit')
    await expect(page.getByText('Approval Queue')).toBeVisible()
  })

  test('navigates to Council', async ({ page }) => {
    await page.getByRole('link', { name: 'Council' }).click()
    await expect(page.locator('h1')).toContainText('Council Meeting')
  })

  test('navigates to Founder portal', async ({ page }) => {
    await page.getByRole('link', { name: 'Founder' }).click()
    await expect(page.locator('h1')).toContainText("Founder's Portal")
    // Founder portal shows PIN gate first (role-gated)
    await expect(page.getByText('Founder Portal')).toBeVisible()
    await expect(page.getByPlaceholder('Enter PIN')).toBeVisible()
  })

  test('navigates to Personal layer', async ({ page }) => {
    await page.getByRole('link', { name: 'Personal' }).click()
    await expect(page.locator('h1')).toContainText("Moe's Personal Layer")
  })

  test('sidebar collapses and expands', async ({ page }) => {
    // Sidebar should show labels by default
    await expect(page.getByRole('link', { name: 'Business' })).toBeVisible()
    // Click collapse
    const toggleBtn = page.locator('aside button').last()
    await toggleBtn.click()
    // After collapse, sidebar is narrower — labels may be hidden
    // Expand again
    await toggleBtn.click()
    await expect(page.getByRole('link', { name: 'Business' })).toBeVisible()
  })
})

test.describe('Mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openAuthenticatedApp(page)
  })

  test('opens a drawer from the hamburger trigger and closes via overlay', async ({ page }) => {
    const openNavButton = page.getByRole('button', { name: 'Open navigation' })
    await expect(openNavButton).toBeVisible()
    await openNavButton.click()

    const mobileDialog = page.getByRole('dialog', { name: 'Mobile navigation' })
    await expect(mobileDialog).toBeVisible()
    await expect(mobileDialog.getByRole('link', { name: 'Business' })).toBeVisible()

    await page.mouse.click(360, 80)
    await expect(mobileDialog).toBeHidden()
  })

  test('closes the mobile drawer after selecting a destination', async ({ page }) => {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('dialog', { name: 'Mobile navigation' }).getByRole('link', { name: 'Cockpit' }).click()

    await expect(page.locator('h1')).toContainText('Decision Cockpit')
    await expect(page.getByRole('dialog', { name: 'Mobile navigation' })).toBeHidden()
  })

  test('shows bottom navigation shortcuts without overlapping the page content', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Agents' })).toBeVisible()
    await expect(page.getByText('Salla Store Health')).toBeVisible()
  })

  test('keeps product tables horizontally usable on mobile', async ({ page }) => {
    const scroller = page.getByTestId('product-performance-table-scroll')
    await expect(scroller).toBeVisible()
    await expect(page.getByText('Swipe to view all product columns')).toBeVisible()

    const metrics = await scroller.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
    }))

    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)
  })

  test('keeps OS data grids horizontally usable on mobile', async ({ page }) => {
    await page.goto('/os')

    const matrixScroller = page.getByTestId('agent-performance-table-scroll')
    const pipelineScroller = page.getByTestId('pipeline-flow-scroll')

    await expect(matrixScroller).toBeVisible()
    await expect(pipelineScroller).toBeVisible()
    await expect(page.getByText('Swipe to compare all agent metrics')).toBeVisible()
    await expect(page.getByText('Swipe across stages to review the full pipeline')).toBeVisible()

    const matrixMetrics = await matrixScroller.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
    }))
    const pipelineMetrics = await pipelineScroller.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
    }))

    expect(matrixMetrics.scrollWidth).toBeGreaterThan(matrixMetrics.clientWidth)
    expect(pipelineMetrics.scrollWidth).toBeGreaterThan(pipelineMetrics.clientWidth)
  })

  test('stacks responsive summary cards cleanly on mobile', async ({ page }) => {
    const businessMetrics = page.getByTestId('store-health-metrics')
    await expect(businessMetrics).toBeVisible()

    const businessColumns = await businessMetrics.evaluate((el) => getComputedStyle(el).gridTemplateColumns)
    expect(businessColumns.split(' ').length).toBe(1)

    await page.goto('/founder')
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: 'Enter Portal' }).click()
    const founderMetrics = page.getByTestId('founder-overview-metrics')
    await expect(founderMetrics).toBeVisible()
    const founderColumns = await founderMetrics.evaluate((el) => getComputedStyle(el).gridTemplateColumns)
    expect(founderColumns.split(' ').length).toBe(1)

    await page.goto('/paperclip')
    const paperclipMetrics = page.getByTestId('paperclip-summary-cards')
    await expect(paperclipMetrics).toBeVisible()
    const paperclipColumns = await paperclipMetrics.evaluate((el) => getComputedStyle(el).gridTemplateColumns)
    expect(paperclipColumns.split(' ').length).toBe(2)
  })
})
