import { App } from 'app'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const { layout, page } = await vi.hoisted(async function () {
  const { createElement } = await import('react')
  const { Outlet } = await import('react-router')
  return {
    layout: (name: string) => ({ [name]: () => createElement(Outlet) }),
    page: (name: string, text: string) => ({
      [name]: () => createElement('p', null, text),
    }),
  }
})

vi.mock('i18n/routing', () => ({ preferredLocale: () => 'en' }))
vi.mock('components/errorBoundary', () => ({
  ErrorBoundary: ({ children }) => children,
}))
vi.mock('components/error500', () => ({ UntranslatedError500: () => null }))

vi.mock('app/[locale]/layout', () => layout('LocaleLayout'))
vi.mock('app/[locale]/ecosystem/layout', () => layout('EcosystemLayout'))
vi.mock('app/[locale]/ecosystem/page', () =>
  page('EcosystemPage', 'ecosystem page'),
)
vi.mock('app/[locale]/get-started/layout', () => layout('GetStartedLayout'))
vi.mock('app/[locale]/get-started/page', () =>
  page('GetStartedPage', 'get started page'),
)
vi.mock('app/[locale]/hemi-earn/layout', () => layout('HemiEarnLayout'))
vi.mock('app/[locale]/hemi-earn/page', () =>
  page('HemiEarnPage', 'hemi earn page'),
)
vi.mock('app/[locale]/hemi-earn/vault/[shareAddress]/page', () =>
  page('VaultPage', 'vault page'),
)
vi.mock('app/[locale]/hemi-stake/analytics/page', () =>
  page('HemiStakeAnalyticsPage', 'hemi stake analytics page'),
)
vi.mock('app/[locale]/hemi-stake/layout', () => layout('HemiStakeLayout'))
vi.mock('app/[locale]/hemi-stake/page', () =>
  page('HemiStakePage', 'hemi stake page'),
)
vi.mock('app/[locale]/not-found', () => page('NotFound', 'not found page'))
vi.mock('app/[locale]/stake/dashboard/page', () =>
  page('StakeDashboardPage', 'stake dashboard page'),
)
vi.mock('app/[locale]/stake/layout', () => layout('StakeLayout'))
vi.mock('app/[locale]/stake/page', () => page('StakePage', 'stake page'))
vi.mock('app/[locale]/tunnel/layout', () => layout('TunnelLayout'))
vi.mock('app/[locale]/tunnel/page', () => page('TunnelPage', 'tunnel page'))
vi.mock('app/[locale]/tunnel/transaction-history/page', () =>
  page('TransactionHistoryPage', 'transaction history page'),
)

const renderAt = function (url: string) {
  window.history.pushState({}, '', url)
  return render(<App />)
}

describe('App', function () {
  it.each([
    ['/en/tunnel', 'tunnel page'],
    ['/en/tunnel/transaction-history', 'transaction history page'],
    ['/en/ecosystem', 'ecosystem page'],
    ['/en/get-started', 'get started page'],
    ['/en/hemi-earn', 'hemi earn page'],
    ['/en/hemi-earn/vault/0x123', 'vault page'],
    ['/en/stake', 'stake page'],
    ['/en/stake/dashboard', 'stake dashboard page'],
    ['/en/hemi-stake', 'hemi stake page'],
    ['/en/hemi-stake/analytics', 'hemi stake analytics page'],
    ['/en/unknown', 'not found page'],
  ])('should render %s', async function (url, text) {
    const screen = await renderAt(url)
    await expect.element(screen.getByText(text)).toBeVisible()
  })

  it.each([
    ['/', '/en/hemi-stake', 'hemi stake page'],
    ['/en', '/en/hemi-stake', 'hemi stake page'],
    ['/stake', '/en/stake/dashboard', 'stake dashboard page'],
    ['/staking-dashboard', '/en/hemi-stake', 'hemi stake page'],
    ['/en/staking-dashboard', '/en/hemi-stake', 'hemi stake page'],
    ['/en/demos', '/en/ecosystem', 'ecosystem page'],
  ])('should redirect %s to %s', async function (url, target, text) {
    const screen = await renderAt(url)
    await expect.element(screen.getByText(text)).toBeVisible()
    expect(window.location.pathname).toBe(target)
  })
})
