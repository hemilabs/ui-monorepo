import { stringToHex, type Hex } from 'viem'

type FundedStream = {
  fundedByClass: { transferable: bigint }
  label: Hex
}

const baselineLabel = stringToHex('baseline', { size: 32 })

export const getBaselinePot = (streams: FundedStream[]) =>
  streams
    .filter(stream => stream.label === baselineLabel)
    .reduce(
      (total, stream) => total + stream.fundedByClass.transferable,
      BigInt(0),
    )
