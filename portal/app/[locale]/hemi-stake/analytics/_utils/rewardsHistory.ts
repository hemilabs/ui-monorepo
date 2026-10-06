import { type EvmToken } from 'types/token'
import { secondsPerDay } from 'utils/time'
import { getTokenByAddress } from 'utils/token'
import { SixDaysSeconds } from 've-hemi-actions'
import { type Address, formatUnits, isAddressEqual } from 'viem'

import { daysPerPeriod } from './periods'

type EpochReward = {
  funded: string
  priceUsd: string | null
  token: {
    address: Address
    chainId: number
  }
}

type PreHemiStakeRound = {
  from: string
  fundedEpoch: number
  round: number
  to: string
}

export type RewardsEpoch = {
  epoch: number
  preHemiStake?: PreHemiStakeRound
  rewards: EpochReward[]
  settled: boolean
  timestamp: number
}

export type RewardsPeriod = '1m' | '1y' | '3m' | '6m'

export type RewardsBar = {
  preHemiStake?: PreHemiStakeRound
  projected: boolean
  settled: boolean
  timestamp: number
  x: number
  y: number
}

export type RewardsSeries = {
  color: string
  points: RewardsBar[]
  symbol: string
}

const seriesColors = ['#FF4600', '#009CF5', '#737373', '#D4D4D4']

const baselineIncentives = {
  firstEpoch: 3404,
  hemiPerEpoch: 4_166_666.66,
  lastEpoch: 3461,
}

const toUsd = ({ funded, priceUsd }: EpochReward, decimals: number) =>
  priceUsd === null
    ? 0
    : Number(formatUnits(BigInt(funded), decimals)) * Number(priceUsd)

const findReward = (rewards: EpochReward[], token: EvmToken) =>
  rewards.find(reward =>
    isAddressEqual(reward.token.address, token.address as Address),
  )

const getProjectedEpochs = function ({
  epochs,
  period,
}: {
  epochs: RewardsEpoch[]
  period: RewardsPeriod
}) {
  const lastEpoch = epochs[epochs.length - 1].epoch
  const periodEpochs = Math.ceil(
    (daysPerPeriod[period] * secondsPerDay) / SixDaysSeconds,
  )
  const firstEpoch = Math.max(baselineIncentives.firstEpoch, lastEpoch + 1)
  const toEpoch = Math.min(
    baselineIncentives.lastEpoch,
    lastEpoch + Math.max(1, periodEpochs - epochs.length),
  )
  return Array.from(
    { length: Math.max(0, toEpoch - firstEpoch + 1) },
    (_, i) => firstEpoch + i,
  )
}

const getLatestPrice = (epochs: RewardsEpoch[], token: EvmToken) =>
  epochs
    .flatMap(({ rewards }) => findReward(rewards, token)?.priceUsd ?? [])
    .at(-1)

const getHemiProjectedUsd = function (
  epochs: RewardsEpoch[],
  hemiToken: EvmToken | undefined,
) {
  const priceUsd = hemiToken && getLatestPrice(epochs, hemiToken)
  return priceUsd === undefined
    ? 0
    : baselineIncentives.hemiPerEpoch * Number(priceUsd)
}

const toSeries = ({
  epochs,
  index,
  projectedEpochs,
  projectedUsd,
  token,
}: {
  epochs: RewardsEpoch[]
  index: number
  projectedEpochs: number[]
  projectedUsd: number
  token: EvmToken
}) => ({
  color: seriesColors[index % seriesColors.length],
  points: [
    ...epochs.map(function ({
      epoch,
      preHemiStake,
      rewards,
      settled,
      timestamp,
    }) {
      const reward = findReward(rewards, token)
      return {
        preHemiStake,
        projected: false,
        settled,
        timestamp: timestamp * 1000,
        x: epoch,
        y: reward === undefined ? 0 : toUsd(reward, token.decimals),
      }
    }),
    ...projectedEpochs.map(epoch => ({
      projected: true,
      settled: false,
      timestamp: (epoch + 1) * SixDaysSeconds * 1000,
      x: epoch,
      y: projectedUsd,
    })),
  ],
  symbol: token.symbol,
})

export const toRewardsSeries = function ({
  epochs,
  hemiAddress,
  period,
}: {
  epochs: RewardsEpoch[]
  hemiAddress: Address
  period: RewardsPeriod
}) {
  const tokens = epochs
    .flatMap(({ rewards }) => rewards.map(({ token }) => token))
    .filter(
      (token, index, all) =>
        all.findIndex(other => isAddressEqual(other.address, token.address)) ===
        index,
    )
    .map(({ address, chainId }) => getTokenByAddress(address, chainId))
    .filter((token): token is EvmToken => token !== undefined)
  const hemiToken = tokens.find(token =>
    isAddressEqual(token.address as Address, hemiAddress),
  )
  const hemiProjectedUsd = getHemiProjectedUsd(epochs, hemiToken)
  const projectedEpochs =
    hemiProjectedUsd > 0 ? getProjectedEpochs({ epochs, period }) : []
  return tokens.map((token, index) =>
    toSeries({
      epochs,
      index,
      projectedEpochs,
      projectedUsd: token === hemiToken ? hemiProjectedUsd : 0,
      token,
    }),
  )
}
