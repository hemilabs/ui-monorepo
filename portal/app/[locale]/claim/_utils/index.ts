import { NetworkType } from 'hooks/useNetworkType'
import { smartRound } from 'smart-round'
import { formatUnits } from 'viem'

export const PercentageApyStakedHemi = 9

const formatter = smartRound(12, 2, 2)

export const formatHemi = (amount: bigint, decimals: number) =>
  formatter(formatUnits(amount, decimals), {
    roundingMode: 'round-down',
    shouldFormat: true,
  })

export const isClaimRewardsEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  process.env.NEXT_PUBLIC_ENABLE_CLAIM_REWARDS_TESTNET === 'true'
