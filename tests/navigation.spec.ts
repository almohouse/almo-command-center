import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
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
