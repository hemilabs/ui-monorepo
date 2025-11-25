import type { NetworkType } from 'hooks/useNetworkType'
import { formatPercentage } from 'utils/format'

import type { Strategy } from '../_types'

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
