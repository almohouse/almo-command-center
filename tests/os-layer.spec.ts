import { test, expect } from '@playwright/test'

test.describe('OS Layer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/os')
  })

  test('shows agent performance matrix', async ({ page }) => {
    await expect(page.getByText('Agent Performance Matrix')).toBeVisible()
    await expect(page.getByText('Completion')).toBeVisible()
    await expect(page.getByText('Revision Rate')).toBeVisible()
    await expect(page.getByText('7-Day Output')).toBeVisible()
  })

  test('shows agent rows', async ({ page }) => {
    await expect(page.getByText('Chief Technology Officer')).toBeVisible()
    await expect(page.getByText('Deputy CEO')).toBeVisible()
  })

  test('shows pipeline kanban', async ({ page }) => {
    await expect(page.getByText('Pipeline Flow')).toBeVisible()
    await expect(page.getByText('Backlog')).toBeVisible()
    await expect(page.getByText('In Progress')).toBeVisible()
    await expect(page.getByText('In Review')).toBeVisible()
    await expect(page.getByText('Done')).toBeVisible()
  })

  test('shows tasks in pipeline', async ({ page }) => {
    await expect(page.getByText('ALMO Command Center')).toBeVisible()
    await expect(page.getByText('ALM-59')).toBeVisible()
  })

  test('shows task velocity chart', async ({ page }) => {
    await expect(page.getByText('Task Velocity')).toBeVisible()
    await expect(page.locator('svg').first()).toBeVisible()
  })
})
