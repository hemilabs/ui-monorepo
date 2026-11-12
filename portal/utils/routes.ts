// Plain data on purpose: this is imported by plugins/sitemap.ts in Node at
// config time, so it can't contain JSX or runtime path-alias imports.
// app.tsx maps every id to its element.
export type RouteDefinition = {
  children?: readonly RouteDefinition[]
  featureFlag?: 'hemiEarn'
  id: string
  index?: true
  path?: string
  redirect?: true
}

export const routes = [
  { id: 'rootRedirect', path: '/', redirect: true },
  { id: 'stakeRedirect', path: '/stake', redirect: true },
  {
    id: 'stakingDashboardRedirect',
    path: '/staking-dashboard',
    redirect: true,
  },
  {
    children: [
      { id: 'landingRedirect', index: true, redirect: true },
      {
        children: [
          { id: 'tunnelPage', index: true },
          { id: 'transactionHistoryPage', path: 'transaction-history' },
        ],
        id: 'tunnelLayout',
        path: 'tunnel',
      },
      {
        children: [{ id: 'ecosystemPage', index: true }],
        id: 'ecosystemLayout',
        path: 'ecosystem',
      },
      { id: 'demosRedirect', path: 'demos', redirect: true },
      {
        children: [{ id: 'getStartedPage', index: true }],
        id: 'getStartedLayout',
        path: 'get-started',
      },
      {
        children: [
          { id: 'hemiEarnPage', index: true },
          { id: 'vaultPage', path: 'vault/:shareAddress' },
        ],
        featureFlag: 'hemiEarn',
        id: 'hemiEarnLayout',
        path: 'hemi-earn',
      },
      {
        children: [
          { id: 'stakePage', index: true },
          { id: 'stakeDashboardPage', path: 'dashboard' },
        ],
        id: 'stakeLayout',
        path: 'stake',
      },
      {
        children: [
          { id: 'hemiStakePage', index: true },
          { id: 'hemiStakeAnalyticsPage', path: 'analytics' },
          { id: 'hemiStakeEstimatorPage', path: 'estimator' },
        ],
        id: 'hemiStakeLayout',
        path: 'hemi-stake',
      },
      { id: 'hemiStakeRedirect', path: 'staking-dashboard', redirect: true },
      { id: 'notFound', path: '*' },
    ],
    id: 'localeLayout',
    path: '/:locale',
  },
] as const satisfies readonly RouteDefinition[]

type IdOf<T> = T extends { children: infer C extends readonly unknown[] }
  ? T extends { id: infer I }
    ? I | IdOf<C[number]>
    : never
  : T extends { id: infer I }
    ? I
    : never

export type RouteId = IdOf<(typeof routes)[number]>
