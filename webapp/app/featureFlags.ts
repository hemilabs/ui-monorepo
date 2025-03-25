export const featureFlags = {
  syncHistoryWithdrawalsWithSubgraph:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_SYNC_WITHDRAWALS_SUBGRAPH === 'true',
  syncHistoryWithSubgraph:
    process.env.NEXT_PUBLIC_FEATURE_FLAG_SYNC_SUBGRAPH === 'true',
}
