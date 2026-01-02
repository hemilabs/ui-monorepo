import type { NetworkType } from 'hooks/useNetworkType'
import { type ClaimReward } from 'merkl-claim-rewards'
import { formatPercentage } from 'utils/format'
import type { MerklRewards } from 'utils/merkl'
import type { Address } from 'viem'

import type { Strategy } from '../_types'

// Merkl distributor address for Hemi mainnet
export const MERKL_DISTRIBUTOR_ADDRESS: Address =
  '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae'

/**
 * Transforms MerklRewards data into parameters required by claimAllRewards function
 * Note: assumes all rewards are already claimable since getUserRewards uses claimableOnly=true
 * @param rewards - Array of merkl rewards (all assumed to be claimable)
 * @returns Object with arrays for amounts, proofs, tokens, and users
 */
export const transformMerklRewardsToClaimParams = (rewards: MerklRewards) =>
  rewards.reduce(
    function (acc, reward) {
      acc.amounts.push(BigInt(reward.amount))
      acc.proofs.push(reward.proofs)
      acc.tokens.push(reward.token.address)
      acc.users.push(reward.recipient as Address)

      return acc
    },
    {
      amounts: [],
      proofs: [],
      tokens: [],
      users: [],
    } as Omit<ClaimReward, 'account'>,
  )

export const calculatePoolBufferWeight = function (strategies: Strategy[]) {
  const totalWeight = strategies.reduce(
    (sum, strategy) => sum + strategy.weight,
    BigInt(0),
  )
  return BigInt(10000) - totalWeight
}

// Formats strategy names to be more human-readable
// Based on Vesper strategy formatting.
export const formatStrategyName = function (
  name: string,
  poolAssetSymbol: string,
) {
  const poolAsset = poolAssetSymbol.replace('.E', '')
  const removeLastTokenRegex = new RegExp(`${poolAsset}([^${poolAsset}]*)$`)

  return name
    .replace(/Strategy|V2|Avalanche/g, '') // Remove words from the strategy name
    .replace(/-|_/g, ' ') // Replace all dashes and underscores with a space
    .replace(/Alpha/, 'Alpha Homora') // Replace with the complete name
    .replace(/Crv/, 'Curve') // Replace abbreviation
    .replace(/AlUSD/, 'ALUSD') // Uppercase alUSD token to be consistent
    .replace(/Xy/, 'XY') // Uppercase Xy
    .replace(/([^\s])lend/g, '$1 lend') // Add a space before lend
    .replace(removeLastTokenRegex, '') // Remove last occurrence of the pool token symbol
    .replace(/(V[0-9])/g, '') // Remove versions i.e. V2, V3
    .replace(/([a-z](?=[A-Z]))/g, '$1 ') // Add a space after an uppercase that has a lowercase before it
    .replace(/(Pool|Meta|XY|[0-9])/g, ' $1 ') // Add space between some characters
    .replace(/D 3/g, ' D3 ') // Remove space between D3
    .replace(/  +/g, ' ') // Remove extra spaces
    .trim()
}

export const formatStrategyWeight = (weight: bigint) =>
  formatPercentage(Number(weight) / 100)

export const isBitcoinYieldEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  process.env.NEXT_PUBLIC_ENABLE_BTC_YIELD_TESTNET === 'true'
