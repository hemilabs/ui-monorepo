import pMemoize from 'promise-mem'
import { getEpochFunding, getSystemState } from 've-hemi-epoch-rewards/actions'
import { type Address } from 'viem'
import { hemi } from 'viem/chains'
// Disabled until we bump the eslint-plugin-node version
// See https://github.com/bloq/eslint-config-bloq/issues/64
// eslint-disable-next-line node/no-missing-import
import { symbol as readSymbol } from 'viem-erc20/actions'

import { dayMs, toDate } from '../dates.ts'
import { getHemiClient } from '../hemiClient.ts'
import { getPeriodDays } from '../periods.ts'
import { type Cache } from '../redis.ts'

const client = getHemiClient(hemi.id)

const isFunded = (rewards: { funded: bigint }[]) =>
  rewards.some(({ funded }) => funded > BigInt(0))

const toPriceSymbol = (symbol: string) =>
  symbol.toUpperCase().endsWith('BTC') ? 'BTC' : symbol.toUpperCase()

const getPriceSymbol = pMemoize(async (address: Address) =>
  toPriceSymbol(await readSymbol(client, { address })),
)

// The past 2 funding rounds paid to veHEMI holders before hemiStake, by the
// original veHemiRewards contract. epoch is firstFundableEpoch and the next one,
// which hemiStake never funded, so the bars go right before the first funded one.
// fundedEpoch is the real epoch of the funding. timestamp is the block timestamp
// of the first RewardsAdded event of the round, and priceUsd the CoinMarketCap closing price of that date.
const preHemiStakeEpochs = [
  {
    epoch: 3400,
    preHemiStake: {
      from: '2025-08-30',
      fundedEpoch: 3349,
      round: 1,
      to: '2025-10-30',
    },
    rewards: [
      {
        claimed: null,
        funded: '100320689999982000000000',
        priceUsd: '0.039167509418732135',
        swept: false,
        token: {
          // HEMI
          address: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
          chainId: hemi.id,
        },
      },
      {
        claimed: null,
        funded: '24449948',
        priceUsd: '108288.27130924167',
        swept: false,
        token: {
          // hemiBTC
          address: '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28',
          chainId: hemi.id,
        },
      },
    ],
    settled: true,
    timestamp: 1761859727,
  },
  {
    epoch: 3401,
    preHemiStake: {
      from: '2025-10-31',
      fundedEpoch: 3366,
      round: 2,
      to: '2026-02-05',
    },
    rewards: [
      {
        claimed: null,
        funded: '623727272000000000000000',
        priceUsd: '0.011644447657320067',
        swept: false,
        token: {
          // HEMI
          address: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
          chainId: hemi.id,
        },
      },
      {
        claimed: null,
        funded: '10315382',
        priceUsd: '70109.42535305266',
        swept: false,
        token: {
          // hemiBTC
          address: '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28',
          chainId: hemi.id,
        },
      },
    ],
    settled: true,
    timestamp: 1770657863,
  },
]

const firstFundedEpoch = 3402

const toSortedPrices = (history: Record<string, string> | null) =>
  history === null ? null : { days: Object.keys(history).sort(), history }

const findPrice = function (
  prices: ReturnType<typeof toSortedPrices>,
  date: string,
) {
  if (prices === null) {
    return null
  }
  const latest = prices.days.findLast(day => day <= date)
  return latest === undefined ? null : prices.history[latest]
}

export const createHemiStakeRewards = function ({ cache }: { cache: Cache }) {
  const getPriceHistory = (symbol: string) =>
    cache.getPriceHistory(symbol).catch(function (error) {
      console.warn(`Failed to read the ${symbol} prices:`, error)
      return null
    })

  const getPriceHistories = async function (tokens: readonly Address[]) {
    const symbols = await Promise.all(tokens.map(getPriceSymbol))
    const histories = await Promise.all(symbols.map(getPriceHistory))
    return histories.map(toSortedPrices)
  }

  const getHemiStakeRewards = async function (period: string) {
    const { currentEpoch, epochLength, settledEpoch, tokens } =
      await getSystemState(client)
    const epochSeconds = Number(epochLength)
    // One slot of the period is left for the projected rewards of the portal
    const pastSlots =
      Math.ceil((getPeriodDays(period) * dayMs) / 1000 / epochSeconds) - 1
    // One more epoch is read in case the current one has no funding yet
    const fromEpoch = Math.max(firstFundedEpoch, currentEpoch - pastSlots)
    const [funding, priceHistories] = await Promise.all([
      getEpochFunding(client, { fromEpoch, toEpoch: currentEpoch, tokens }),
      getPriceHistories(tokens),
    ])

    const epochs = Array.from(
      { length: currentEpoch - fromEpoch + 1 },
      (_, i) => ({
        epoch: fromEpoch + i,
        rewards: funding.map(({ claimed, funded, swept, token }, j) => ({
          claimed: claimed[i],
          funded: funded[i],
          priceHistory: priceHistories[j],
          swept: swept[i],
          token,
        })),
      }),
    )
    const unfunded = epochs.findIndex(
      ({ epoch, rewards }) => epoch > settledEpoch && !isFunded(rewards),
    )

    const hemiStakeEpochs = epochs
      .slice(0, unfunded === -1 ? undefined : unfunded)
      .slice(-pastSlots)
      .map(({ epoch, rewards }) => ({
        epoch,
        rewards: rewards.map(
          ({ claimed, funded, priceHistory, swept, token }) => ({
            claimed: claimed.toString(),
            funded: funded.toString(),
            priceUsd: findPrice(
              priceHistory,
              toDate((epoch + 1) * epochSeconds * 1000),
            ),
            swept,
            token: { address: token, chainId: hemi.id },
          }),
        ),
        settled: epoch <= settledEpoch,
        timestamp: (epoch + 1) * epochSeconds,
      }))
    const preHemiStakeCount =
      fromEpoch === firstFundedEpoch
        ? Math.min(
            preHemiStakeEpochs.length,
            pastSlots - hemiStakeEpochs.length,
          )
        : 0

    return [
      ...preHemiStakeEpochs.slice(
        preHemiStakeEpochs.length - preHemiStakeCount,
      ),
      ...hemiStakeEpochs,
    ]
  }

  return { getHemiStakeRewards }
}
