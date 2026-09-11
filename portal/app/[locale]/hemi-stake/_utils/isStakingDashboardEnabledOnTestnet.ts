import { NetworkType } from 'hooks/useNetworkType'

export const isStakingDashboardEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  import.meta.env.VITE_ENABLE_STAKE_GOVERNANCE_TESTNET === 'true'
