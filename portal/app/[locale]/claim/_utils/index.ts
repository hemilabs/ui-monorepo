import { NetworkType } from 'hooks/useNetworkType'

export const isClaimRewardsEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  process.env.NEXT_PUBLIC_ENABLE_CLAIM_REWARDS_TESTNET === 'true'
