export const featureFlags = {
  enableBtcYieldClaimRewards:
    process.env.NEXT_PUBLIC_ENABLE_BTC_YIELD_CLAIM_REWARDS === 'true',
  enableBtcYieldPage: process.env.NEXT_PUBLIC_ENABLE_BTC_YIELD_PAGE === 'true',
}
