'use strict'

const { createPublicClient, http } = require('viem')
const { hemi } = require('viem/chains')

const { getRewardPeriod, getRewardTokens } = require('./ve-hemi-rewards')
const { getTokenDecimals, getTokenSymbol } = require('./erc-20')
const { getTotalVeHemiSupplyAt } = require('./ve-hemi')

const ONE_DAY = 24 * 60 * 60
const SIX_DAYS = ONE_DAY * 6
const EPOCHS = 60 // Epochs in one year

function generateFutureTimestamps() {
  const now = Math.ceil(Date.now() / 1000)
  const startOfDay = now - (now % ONE_DAY)
  const timestamps = []
  let timestamp = startOfDay
  for (let i = 0; i < EPOCHS; i++) {
    timestamps.push(timestamp)
    timestamp += SIX_DAYS
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
          getTokenDecimals(client, address),
          getTokenSymbol(client, address).then(getRatioToHemi),
        ]),
      ),
    )
    const tokens = tokenProps.map(([address, decimals, ratio]) => ({
      address,
      decimals,
      ratio,
    }))
    const totalRewardsPerWeight = await Promise.all(
      timestamps.map(async timestamp =>
        (
          await Promise.all(
            tokens.map(({ address, decimals, ratio }) =>
              getRewardPeriod(client, address, timestamp).then(
                reward =>
                  reward * BigInt(Math.round(ratio * 10 ** (18 - decimals))),
              ),
            ),
          )
        ).reduce((total, reward) => total + reward, 0n),
      ),
    )
    return totalRewardsPerWeight
  }

  /**
   * @param {"43111"|"743111"} chainId
   * @returns {Promise<number[]>}
   */
  async function getVeHemiRewards(chainId) {
    // Will not compute the rewards for chains other than Hemi mainnet
    if (Number(chainId) != hemi.id) {
      return new Array(EPOCHS).fill(0)
    }

    const timestamps = generateFutureTimestamps()
    const [totalWeights, totalRewards] = await Promise.all([
      getTotalWeights(timestamps),
      getTotalRewards(timestamps),
    ])
    // We may be losing some precision in the following division but it is not a
    // problem since we are only interested in an approximate ratio.
    const data = totalWeights.map((weight, i) =>
      weight === 0n ? 0 : Number(totalRewards[i]) / Number(weight),
    )
    return data
  }

  return {
    getVeHemiRewards,
  }
}
