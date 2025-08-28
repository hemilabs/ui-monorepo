import { NetworkType } from 'hooks/useNetworkType'

export const isStakingDashboardEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  process.env.NEXT_PUBLIC_ENABLE_STAKE_GOVERNANCE_TESTNET === 'true'
