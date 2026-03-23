import { test, expect } from '@playwright/test'

test.describe('Founder Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/founder')
  })

  test('shows PIN gate by default', async ({ page }) => {
    await expect(page.getByText('Founder Portal')).toBeVisible()
    await expect(page.getByPlaceholder('Enter PIN')).toBeVisible()
    await expect(page.getByRole('button', { name: /Enter Portal/i })).toBeVisible()
  })

  test('shows demo PIN hint', async ({ page }) => {
    await expect(page.getByText('Demo PIN: 1234')).toBeVisible()
  })

  test('shows error on incorrect PIN', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('9999')
    await page.getByRole('button', { name: /Enter Portal/i }).click()
    await expect(page.getByRole('alert')).toContainText('Incorrect PIN')
  })

  test('unlocks portal with correct PIN (1234)', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: /Enter Portal/i }).click()
    await expect(page.getByText("Alaa's Founder Portal")).toBeVisible()
    await expect(page.getByText('Strategic visibility')).toBeVisible()
  })

  test('shows strategic metrics after unlock', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: /Enter Portal/i }).click()

    await expect(page.getByText('Monthly Revenue')).toBeVisible()
    await expect(page.getByText('Orders This Month')).toBeVisible()
    await expect(page.getByText('Gross Margin')).toBeVisible()
    await expect(page.getByText('Cash Runway')).toBeVisible()
  })

  test('shows action items after unlock', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: /Enter Portal/i }).click()

    await expect(page.getByText('Action Items')).toBeVisible()
    await expect(page.getByText('Review Q1 financial performance report')).toBeVisible()
  })

  test('can mark action items as complete', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: /Enter Portal/i }).click()

    const firstCheckbox = page.getByRole('checkbox').first()
    await firstCheckbox.check()
    await expect(firstCheckbox).toBeChecked()

    // Item title should have line-through
    const itemText = page.getByText('Review Q1 financial performance report')
    await expect(itemText).toHaveClass(/line-through/)
  })

  test('shows pending count badge', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: /Enter Portal/i }).click()

    await expect(page.getByText(/4 pending/)).toBeVisible()
  })

  test('shows all-complete message when all items checked', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: /Enter Portal/i }).click()

    const checkboxes = page.getByRole('checkbox')
    const count = await checkboxes.count()
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check()
    }
    await expect(page.getByText('All action items complete')).toBeVisible()
  })

  test('can lock portal using Lock button', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: /Enter Portal/i }).click()
    await expect(page.getByText("Alaa's Founder Portal")).toBeVisible()

    await page.getByRole('button', { name: /Lock/i }).click()
    await expect(page.getByPlaceholder('Enter PIN')).toBeVisible()
  })

  test('shows revenue trend chart after unlock', async ({ page }) => {
    await page.getByPlaceholder('Enter PIN').fill('1234')
    await page.getByRole('button', { name: /Enter Portal/i }).click()

    await expect(page.getByText('Revenue Trend')).toBeVisible()
  })
})
