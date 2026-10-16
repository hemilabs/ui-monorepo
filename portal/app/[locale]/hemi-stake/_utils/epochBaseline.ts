import { stringToHex, type Hex } from 'viem'

import { type RewardClass } from './rewardClass'

type FundedStream = {
  fundedByClass: Record<RewardClass, bigint>
  label: Hex
}

const baselineLabel = stringToHex('baseline', { size: 32 })

const sumBaseline = (streams: FundedStream[], rewardClass: RewardClass) =>
  streams.reduce(
    (total, stream) => total + stream.fundedByClass[rewardClass],
    BigInt(0),
  )

export const getBaselineByClass = function (streams: FundedStream[]) {
  const baselines = streams.filter(stream => stream.label === baselineLabel)

  return {
    forfeitable: sumBaseline(baselines, 'forfeitable'),
    locked: sumBaseline(baselines, 'locked'),
    transferable: sumBaseline(baselines, 'transferable'),
  }
}
