import { getTotalVeHemiSupplyAt } from 've-hemi-actions/actions'
import { getRewardPeriod, getRewardTokens } from 've-hemi-rewards/actions'
import { createPublicClient, http } from 'viem'
import { hemi } from 'viem/chains'
// This rule throws because the eslint-plugin-node version doesn't understand
// the package.json#exports field which let's Typescript to resolve the correct file.
// Should be fixed when we bump that lib - See https://github.com/bloq/eslint-config-bloq/issues/64
/* eslint-disable node/no-missing-import */
import {
  decimals as readDecimals,
  symbol as readSymbol,
} from 'viem-erc20/actions'

import type { Cache } from '../redis.ts'

const ONE_DAY = 24 * 60 * 60
const EPOCH_DAYS = 6
const EPOCH = ONE_DAY * EPOCH_DAYS
const YEAR_EPOCHS = 366 / EPOCH_DAYS // 366 to make YEAR_EPOCHS a whole number
const PAST_REWARDS_DAYS = 60

function generateTimestamps(epochs: number, epoch: number) {
  const now = Math.ceil(Date.now() / 1000)
  const startOfDay = now - (now % ONE_DAY)
  const timestamps: number[] = []
  let timestamp = startOfDay
  for (let i = 0; i < epochs; i++) {
    timestamps.push(timestamp)
    timestamp += epoch
  }
  return timestamps
}

function createVeHemi({ cache }: { cache: Cache }) {
  const client = createPublicClient({
    chain: hemi,
    transport: http(undefined, { batch: true }),
  })

  async function getTotalWeights(timestamps: number[]) {
    const totalWeights = await Promise.all(
      timestamps.map(timestamp =>
        getTotalVeHemiSupplyAt(client, { timestamp }),
      ),
    )
    return totalWeights
  }

  async function getRatioToHemi(symbol: string) {
    if (symbol === 'HEMI') {
      return 1
    }

    const { prices } = await cache.getTokenPrices()
    const tokenPrice = prices[symbol]
    if (tokenPrice) {
      return Number(tokenPrice) / Number(prices['HEMI'])
    }

    // Let's assume BTC-like tokens are worth 1 BTC
    if (symbol.endsWith('BTC')) {
      return Number(prices['BTC']) / Number(prices['HEMI'])
    }

    console.warn(`Price for ${symbol} not found`)
    return 0
  }

  async function getTotalRewards(timestamps: number[]) {
    const tokenAddresses = await getRewardTokens(client)
    const tokenProps = await Promise.all(
      tokenAddresses.map(tokenAddress =>
        Promise.all([
          tokenAddress,
          readDecimals(client, { address: tokenAddress }),
          readSymbol(client, { address: tokenAddress }).then(getRatioToHemi),
        ]),
      ),
    )
    const tokens = tokenProps.map(([tokenAddress, decimals, ratio]) => ({
      decimals,
      ratio,
      tokenAddress,
    }))
    const totalRewards = await Promise.all(
      timestamps.map(async function (timestamp) {
        const rewards = await Promise.all(
          tokens.map(async function ({ decimals, ratio, tokenAddress }) {
            const reward = await getRewardPeriod(client, {
              timestamp,
              tokenAddress,
            })
            return reward * BigInt(Math.round(ratio * 10 ** (18 - decimals)))
          }),
        )
        return rewards.reduce((total, reward) => total + reward, 0n)
      }),
    )
    return totalRewards
  }

  /**
   * Computes the veHemi rewards per unit of weight for the next year.
   *
   * As there would be no rewards for future epochs, the function averages the
   * rewards per day for the past 60 days and assumes that reward level will
   * continue for the 60 epochs.
   */
  async function getVeHemiRewards(chainId: '43111' | '743111') {
    // Will not compute the rewards for chains other than Hemi mainnet
    if (Number(chainId) !== hemi.id) {
      return new Array(YEAR_EPOCHS).fill(0)
    }

    const [weightsPerEpoch, pastRewardsPerDay] = await Promise.all([
      getTotalWeights(generateTimestamps(YEAR_EPOCHS, EPOCH)),
      getTotalRewards(generateTimestamps(PAST_REWARDS_DAYS, -ONE_DAY)),
    ])
    const totalRewards = pastRewardsPerDay.reduce((t, reward) => t + reward, 0n)
    const avgPastRewardsPerDay = totalRewards / BigInt(PAST_REWARDS_DAYS)
    const avgPastRewardsPerEpoch = avgPastRewardsPerDay * BigInt(EPOCH_DAYS)
    const rewardsPerWeight = weightsPerEpoch.map(weight =>
      weight === 0n ? 0 : Number(avgPastRewardsPerEpoch) / Number(weight),
    )
    return rewardsPerWeight
  }

  return {
    getVeHemiRewards,
  }
}

export { createVeHemi }
