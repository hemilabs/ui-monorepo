import { getTotalVeHemiSupplyAt } from 've-hemi-actions/actions'
import { getRewardPeriod, getRewardTokens } from 've-hemi-rewards/actions'
import { BaseError, ContractFunctionRevertedError } from 'viem'
// This rule throws because the eslint-plugin-node version doesn't understand
// the package.json#exports field which let's Typescript to resolve the correct file.
// Should be fixed when we bump that lib - See https://github.com/bloq/eslint-config-bloq/issues/64
/* eslint-disable node/no-missing-import */
import {
  decimals as readDecimals,
  symbol as readSymbol,
} from 'viem-erc20/actions'

import { getHemiClient } from '../hemiClient.ts'
import type { Cache } from '../redis.ts'

import { UnsupportedChainError } from './errors.ts'

// Only a refusal from the contract says anything about the deployment; transport errors,
// timeouts and rate limits are about the connection. Discriminate on `raw`, not on the
// error type - viem also synthesises a ContractFunctionRevertedError for a bare -32603,
// and believing that would turn a node blip on mainnet into a cached 404.
const isContractRevert = function (error: unknown) {
  const reverted =
    error instanceof BaseError
      ? error.walk(e => e instanceof ContractFunctionRevertedError)
      : null
  return (
    reverted instanceof ContractFunctionRevertedError &&
    reverted.raw !== undefined
  )
}

type HemiClient = ReturnType<typeof getHemiClient>

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
  async function getTotalWeights(client: HemiClient, timestamps: number[]) {
    const totalWeights = await Promise.all(
      timestamps.map(timestamp =>
        getTotalVeHemiSupplyAt(client, { timestamp }),
      ),
    ).catch(function (error) {
      // Only a contract refusal means the chain cannot serve this. A veHEMI without
      // `totalVeHemiSupplyAt` reverts deterministically; a rate-limited node is
      // transient and has to stay a 5xx rather than being cached as a 404.
      if (!isContractRevert(error)) {
        throw error
      }
      // Pinning this route to mainnet hid the problem behind a row of zeros that read
      // as a real 0% APR. Neither that nor a 500 is true: the chain has no series.
      throw new UnsupportedChainError(
        `veHEMI on chain ${client.chain?.id} cannot report a total supply: ${(error as Error).message}`,
      )
    })
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

  async function getTotalRewards(client: HemiClient, timestamps: number[]) {
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
    // Resolved per request rather than at module scope. This was pinned to mainnet with
    // every other chain short-circuited to zeros, so `/ve-hemi-rewards/743111` answered
    // 0% APR that looked like data. Cheap: the route caches for four hours.
    const client = getHemiClient(Number(chainId))

    const [weightsPerEpoch, pastRewardsPerDay] = await Promise.all([
      getTotalWeights(client, generateTimestamps(YEAR_EPOCHS, EPOCH)),
      getTotalRewards(client, generateTimestamps(PAST_REWARDS_DAYS, -ONE_DAY)),
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
