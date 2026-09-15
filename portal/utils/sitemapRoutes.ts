const contentRoutes = [
  '/ecosystem',
  '/genesis-drop',
  '/get-started',
  '/hemi-stake',
  '/stake',
  '/stake/dashboard',
  '/tunnel',
  '/tunnel/transaction-history',
] as const

export const sitemapRoutes = (includeHemiEarn: boolean) =>
  [...contentRoutes, ...(includeHemiEarn ? ['/hemi-earn'] : [])].sort()
