import { test, expect, type Page } from '@playwright/test'

async function openAuthenticatedRoute(page: Page, path: string) {
  await page.addInitScript(() => {
    window.localStorage.setItem('almo_cc_auth', 'true')
  })
  await page.goto(path)
}

const MOCK_AGENTS = [
  { id: 'a1', name: 'ALMO Deputy CEO', role: 'general', status: 'online', completionRate: 90, revisionRate: 5, avgTaskHours: 2, tasksCompleted: 20, tasksRevised: 2, trend7d: [5,6,5,7,6,8,7] },
  { id: 'a2', name: 'CTO', role: 'cto', status: 'online', completionRate: 95, revisionRate: 3, avgTaskHours: 1.5, tasksCompleted: 30, tasksRevised: 1, trend7d: [6,7,8,7,9,8,9] },
]

const MOCK_CONVERSATIONS = [
  { id: 'c1', from: 'CTO', agentId: 'a2', message: 'Phase 2 implementation in progress. Wiring live data.', time: '13:30', issueIdentifier: 'ALM-60', createdAt: '2026-03-23T13:30:00Z' },
]

test.describe('Decision Cockpit', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/approvals', (route) => route.fulfill({ json: [] }))
    await page.route('**/api/agents', (route) => route.fulfill({ json: MOCK_AGENTS }))
    await page.route('**/api/conversations', (route) => route.fulfill({ json: MOCK_CONVERSATIONS }))
    await openAuthenticatedRoute(page, '/cockpit')
  })

  test('shows approval queue section with live data state', async ({ page }) => {
    await expect(page.getByText('Approval Queue')).toBeVisible()
    // Live data: shows either pending approvals OR empty state
    const emptyOrPending = page.locator(':text("No pending approvals"), :text("All clear"), button:has-text("Approve")')
    await expect(emptyOrPending.first()).toBeVisible({ timeout: 10000 })
  })

  test('shows direct command input and agent selector', async ({ page }) => {
    await expect(page.getByText('Direct Command')).toBeVisible()
    await expect(page.getByPlaceholder('Type your directive...')).toBeVisible()
    // Agent dropdown should load real agents
    await page.waitForSelector('select', { timeout: 5000 })
    await expect(page.locator('select')).toBeVisible()
  })

  test('send button disabled with empty command', async ({ page }) => {
    const sendBtn = page.getByRole('button', { name: /Send/ })
    await expect(sendBtn).toBeDisabled()
  })

  test('send button enabled when agent and command provided', async ({ page }) => {
    // Wait for agents dropdown to populate
    await page.waitForFunction(() => {
      const opts = document.querySelectorAll('select option')
      return opts.length > 1
    }, { timeout: 10000 })
    await page.selectOption('select', { index: 1 })
    await page.getByPlaceholder('Type your directive...').fill('Prioritize the Salla integration')
    const sendBtn = page.getByRole('button', { name: /Send to/ })
    await expect(sendBtn).toBeEnabled()
  })

  test('shows agent conversations section', async ({ page }) => {
    await expect(page.getByText('Agent Conversations')).toBeVisible()
    // Either live conversations or empty state message
    const convsSection = page.locator(':text("Agent Conversations")').locator('..').locator('..')
    await expect(convsSection).toBeVisible()
  })
})
