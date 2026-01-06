import { featureFlags } from 'app/featureFlags'
import type { NetworkType } from 'hooks/useNetworkType'
import { type ClaimReward } from 'merkl-claim-rewards'
import { EvmToken } from 'types/token'
import { toChecksumAddress } from 'utils/address'
import { formatPercentage } from 'utils/format'
import type { MerklRewards, MerklOpportunityResponse } from 'utils/merkl'
import { unixNowTimestamp } from 'utils/time'
import { type Address, isAddress, isAddressEqual } from 'viem'

import type { Strategy } from '../_types'

// Merkl distributor address for Hemi mainnet
export const MERKL_DISTRIBUTOR_ADDRESS: Address =
  '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae'

export const opportunityId = process.env.NEXT_PUBLIC_BTC_YIELD_OPPORTUNITY_ID

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

/**
 * Filters campaigns to return only the active ones based on current Unix timestamp
 * @param campaigns - Array of merkl campaigns
 * @returns Array of active campaigns that have not yet ended
 */
export const getActiveCampaigns = function (
  campaigns: MerklOpportunityResponse['campaigns'] | undefined,
) {
  if (!campaigns) {
    return []
  }

  const now = Number(unixNowTimestamp())
  return campaigns.filter(campaign => campaign.endTimestamp > now)
}

/**
 * Calculates the total APR by combining native rate and merkl rewards
 * Considers whether claiming rewards feature is enabled
 * @param nativeRate - The native yield rate
 * @param merklData - Merkl campaign data containing APR
 * @returns Combined total APR or undefined if data is not available
 */
export const calculateTotalAPR = function (
  nativeRate: number | undefined,
  merklData: MerklOpportunityResponse | undefined,
) {
  if (nativeRate === undefined) {
    return undefined
  }

  // If claiming rewards is disabled, only return native rate
  if (!featureFlags.enableBtcYieldClaimRewards || opportunityId === undefined) {
    return nativeRate
  }

  // If claiming is enabled but merkl data is not available, return undefined to wait for it
  if (merklData === undefined) {
    return undefined
  }

  return nativeRate + merklData.apr
}

/**
 * Extracts unique reward tokens from campaigns, removing duplicates based on address and chainId
 * This is because multiple campaigns may offer the same reward
 * @param campaigns - Array of merkl campaigns
 * @returns Array of unique reward tokens with address, chainId, and symbol
 */
export const getUniqueRewardTokens = function (
  campaigns?: MerklOpportunityResponse['campaigns'],
) {
  if (!campaigns) {
    return []
  }

  return campaigns.reduce(
    function (accTokens, campaign) {
      if (
        !accTokens.some(
          t =>
            isAddress(campaign.rewardToken.address) &&
            isAddressEqual(t.address, campaign.rewardToken.address) &&
            t.chainId === campaign.rewardToken.chainId,
        )
      ) {
        accTokens.push({
          address: toChecksumAddress(campaign.rewardToken.address),
          chainId: campaign.rewardToken.chainId,
          symbol: campaign.rewardToken.symbol,
        })
      }
      return accTokens
    },
    [] as (Pick<EvmToken, 'chainId' | 'symbol'> & { address: Address })[],
  )
}

export const formatAPRDisplay = function (apr: number) {
  // For very small values, show "< 0.01%"
  if (apr < 0.01) {
    return '< 0.01%'
  }
  return formatPercentage(apr)
}
