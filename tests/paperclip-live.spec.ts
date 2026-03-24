import { test, expect } from '@playwright/test'

test.describe('Paperclip live updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('almo_cc_auth', 'true')
      window.__ALMO_LIVE_SYNC_INTERVAL_MS__ = 250
    })
  })

  test('updates agent and issue counts without manual refresh', async ({ page }) => {
    let agentsCallCount = 0
    let issuesCallCount = 0

    await page.route('**/api/agents', async (route) => {
      agentsCallCount += 1
      const firstPayload = [
        {
          id: 'a1',
          name: 'CTO',
          role: 'cto',
          status: 'online',
          completionRate: 94,
          revisionRate: 3,
          avgTaskHours: 1.5,
          tasksCompleted: 12,
          tasksRevised: 1,
          trend7d: [3, 4, 5, 4, 5, 6, 7],
        },
      ]
      const secondPayload = [...firstPayload, {
        id: 'a2',
        name: 'Frontend',
        role: 'frontend',
        status: 'online',
        completionRate: 91,
        revisionRate: 4,
        avgTaskHours: 2.1,
        tasksCompleted: 9,
        tasksRevised: 1,
        trend7d: [2, 3, 4, 4, 5, 5, 6],
      }]

      await route.fulfill({ json: agentsCallCount >= 2 ? secondPayload : firstPayload })
    })

    await page.route('**/api/issues?status=todo,in_progress,blocked,in_review', async (route) => {
      issuesCallCount += 1
      const firstPayload = [
        {
          id: 'i1',
          identifier: 'ALM-104',
          title: 'Wire live sync',
          status: 'todo',
          priority: 'critical',
          createdAt: '2026-03-24T09:00:00Z',
          updatedAt: '2026-03-24T09:00:00Z',
        },
      ]
      const secondPayload = [
        {
          id: 'i1',
          identifier: 'ALM-104',
          title: 'Wire live sync',
          status: 'in_progress',
          priority: 'critical',
          createdAt: '2026-03-24T09:00:00Z',
          updatedAt: '2026-03-24T09:02:00Z',
        },
        {
          id: 'i2',
          identifier: 'ALM-105',
          title: 'Live agent runs',
          status: 'todo',
          priority: 'high',
          createdAt: '2026-03-24T09:03:00Z',
          updatedAt: '2026-03-24T09:03:00Z',
        },
      ]

      await route.fulfill({ json: issuesCallCount >= 2 ? secondPayload : firstPayload })
    })

    await page.route('**/api/projects', (route) => route.fulfill({ json: [] }))
    await page.route('**/api/approvals', (route) => route.fulfill({ json: [] }))

    await page.goto('/paperclip')

    await expect(page.getByTestId('paperclip-live-badge')).toContainText('Live auto-sync')
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible()
    await expect(page.locator('[data-testid="paperclip-summary-cards"] .glass-card').nth(0)).toContainText('1')

    await expect.poll(async () => page.locator('[data-testid="paperclip-summary-cards"] .glass-card').nth(0).textContent()).toContain('2')
    await expect(page.getByText('In Progress (1)')).toBeVisible()
    await expect(page.getByText('To Do (1)')).toBeVisible()
    await expect(page.getByTestId('paperclip-last-sync')).toBeVisible()
  })

  test('updates cockpit conversations without clicking refresh', async ({ page }) => {
    let conversationsCallCount = 0

    await page.addInitScript(() => {
      window.localStorage.setItem('almo_cc_auth', 'true')
      window.__ALMO_LIVE_SYNC_INTERVAL_MS__ = 250
    })

    await page.route('**/api/approvals', (route) => route.fulfill({ json: [] }))
    await page.route('**/api/agents', (route) => route.fulfill({ json: [{ id: 'a1', name: 'CTO', role: 'cto', status: 'online', completionRate: 95, revisionRate: 2, avgTaskHours: 1.2, tasksCompleted: 30, tasksRevised: 1, trend7d: [4,5,6,7,6,7,8] }] }))
    await page.route('**/api/conversations', async (route) => {
      conversationsCallCount += 1
      const payload = conversationsCallCount >= 2
        ? [{ id: 'c2', from: 'CTO', agentId: 'a1', message: 'Live status changed to in review.', time: '13:31', issueIdentifier: 'ALM-104', createdAt: '2026-03-24T13:31:00Z' }]
        : []
      await route.fulfill({ json: payload })
    })

    await page.goto('/cockpit')

    await expect(page.getByTestId('cockpit-live-badge')).toContainText('Live auto-sync')
    await expect.poll(async () => page.getByText('Live status changed to in review.').isVisible()).toBe(true)
  })
})
