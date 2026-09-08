const contentRoutes = [
  '/ecosystem',
  '/genesis-drop',
  '/get-started',
  '/stake',
  '/stake/dashboard',
  '/staking-dashboard',
  '/tunnel',
  '/tunnel/transaction-history',
] as const

type Options = {
  includeHemiEarn: boolean
  includeHemiStake: boolean
}

export const sitemapRoutes = ({ includeHemiEarn, includeHemiStake }: Options) =>
  [
    ...contentRoutes,
    ...(includeHemiEarn ? ['/hemi-earn'] : []),
    ...(includeHemiStake ? ['/hemi-stake'] : []),
  ].sort()
