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

export const sitemapRoutes = (includeHemiEarn: boolean) =>
  [...contentRoutes, ...(includeHemiEarn ? ['/hemi-earn'] : [])].sort()
