export const featureFlags = {
  enableBtcYieldClaimRewards:
    process.env.NEXT_PUBLIC_ENABLE_BTC_YIELD_CLAIM_REWARDS === 'true',
  enableBtcYieldPage: process.env.NEXT_PUBLIC_ENABLE_BTC_YIELD_PAGE === 'true',
  enableHemiEarnPage: process.env.NEXT_PUBLIC_ENABLE_HEMI_EARN_PAGE === 'true',
}

/** Nav items gated by feature flags — add keys here when a new nav entry uses `flag`. */
export type NavFeatureFlag = Extract<
  keyof typeof featureFlags,
  'enableBtcYieldPage' | 'enableHemiEarnPage'
>
