export const featureFlags = {
  disableHemiEarnDeposits:
    import.meta.env.VITE_DISABLE_HEMI_EARN_DEPOSITS === 'true',
  enableHemiEarnPage: import.meta.env.VITE_ENABLE_HEMI_EARN_PAGE === 'true',
  enableSafeWallet: import.meta.env.VITE_ENABLE_SAFE_WALLET === 'true',
}
