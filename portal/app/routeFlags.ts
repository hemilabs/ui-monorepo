export const getRouteFlags = (env: Record<string, string | undefined>) => ({
  hemiEarn: env.VITE_ENABLE_HEMI_EARN_PAGE === 'true',
  hemiStakeCalculator: env.VITE_ENABLE_HEMI_STAKE_CALCULATOR === 'true',
})
