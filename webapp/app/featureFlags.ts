export const featureFlags = {
  btcTunnelEnabled:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_ENABLE_BTC_TUNNEL === 'true',
  mainnetEnabled:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_ENABLE_MAINNET === 'true',
  stakeCampaignEnabled:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_ENABLE_STAKE_CAMPAIGN === 'true',
  syncHistoryWithdrawalsWithSubgraph:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_SYNC_WITHDRAWALS_SUBGRAPH === 'true',
  syncHistoryWithSubgraph:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_SYNC_SUBGRAPH === 'true',
}
