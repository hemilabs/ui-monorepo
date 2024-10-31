export const featureFlags = {
  btcTunnelEnabled:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_ENABLE_BTC_TUNNEL === 'true',
  mainnetEnabled:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_ENABLE_MAINNET === 'true',
}
