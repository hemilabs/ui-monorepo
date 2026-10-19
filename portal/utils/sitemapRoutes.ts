const contentRoutes = [
  '/ecosystem',
  '/get-started',
  '/hemi-stake',
  '/hemi-stake/analytics',
  '/hemi-stake/estimator',
  '/stake',
  '/stake/dashboard',
  '/tunnel',
  '/tunnel/transaction-history',
] as const

export const sitemapRoutes = (includeHemiEarn: boolean) =>
  [...contentRoutes, ...(includeHemiEarn ? ['/hemi-earn'] : [])].sort()
