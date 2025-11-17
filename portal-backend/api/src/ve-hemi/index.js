'use strict'

const { createPublicClient, http } = require('viem')
const { hemi } = require('viem/chains')
const erc20Actions = require('viem-erc20/actions') // eslint-disable-line node/no-missing-require

const { getRewardPeriod, getRewardTokens } = require('./ve-hemi-rewards')
const { getTotalVeHemiSupplyAt } = require('./ve-hemi')

const ONE_DAY = 24 * 60 * 60
const EPOCH_DAYS = 6
const EPOCH = ONE_DAY * EPOCH_DAYS
const YEAR_EPOCHS = 366 / EPOCH_DAYS // 366 to make YEAR_EPOCHS a whole number
const PAST_REWARDS_DAYS = 60

function generateTimestamps(epochs, epoch) {
  const now = Math.ceil(Date.now() / 1000)
  const startOfDay = now - (now % ONE_DAY)
  const timestamps = []
  let timestamp = startOfDay
  for (let i = 0; i < epochs; i++) {
    timestamps.push(timestamp)
    timestamp += epoch
  }
  return timestamps
}

module.exports = function ({ cache }) {
  const client = createPublicClient({
    chain: hemi,
    transport: http(undefined, { batch: true }),
  })

  /**
   * @param {number[]} timestamps
   * @returns {Promise<bigint[]>}
   */
  async function getTotalWeights(timestamps) {
    const totalWeights = await Promise.all(
      timestamps.map(timestamp => getTotalVeHemiSupplyAt(client, timestamp)),
    )
    return totalWeights
  }

  /**
   * @param {string} symbol
   */
  async function getRatioToHemi(symbol) {
    if (symbol === 'HEMI') {
      return 1
    }

    const { prices } = await cache.getTokenPrices()
    const tokenPrice = prices[symbol]
    if (tokenPrice) {
      return tokenPrice / prices['HEMI']
    }

    // Let's assume BTC-like tokens are worth 1 BTC
    if (symbol.endsWith('BTC')) {
      return prices['BTC'] / prices['HEMI']
    }

    console.warn(`Price for ${symbol} not found`)
    return 0
  }

  /**
   * @param {number[]} timestamps
   * @returns {Promise<bigint[]>}
   */
  async function getTotalRewards(timestamps) {
    const tokenAddresses = await getRewardTokens(client)
    const tokenProps = await Promise.all(
      tokenAddresses.map(address =>
        Promise.all([
          address,
          erc20Actions.decimals(client, { address }),
          erc20Actions.symbol(client, { address }).then(getRatioToHemi),
        ]),
      ),
    )
    const tokens = tokenProps.map(([address, decimals, ratio]) => ({
      address,
      decimals,
      ratio,
    }))
    const totalRewards = await Promise.all(
      timestamps.map(async function (timestamp) {
        const rewards = await Promise.all(
          tokens.map(async function ({ address, decimals, ratio }) {
            const reward = await getRewardPeriod(client, address, timestamp)
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
   *
   * @param {"43111"|"743111"} chainId
   * @returns {Promise<number[]>}
   */
  async function getVeHemiRewards(chainId) {
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
