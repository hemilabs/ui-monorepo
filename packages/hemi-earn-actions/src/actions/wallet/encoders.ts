import { type Address, encodeFunctionData } from 'viem'

import { routerAbi } from '../../abi'

export const encodeRequestDeposit = ({
  amount,
  asset,
  automatic = true,
  fulfillmentFee,
  receiver,
  sharesOutMin = BigInt(0),
}: {
  amount: bigint
  asset: Address
  automatic?: boolean
  fulfillmentFee: bigint
  receiver: Address
  // Minimum shares accepted on fulfillment (slippage protection enforced
  // on the remote chain). Defaults to `0n` until the asset → shares
  // conversion is wired up; phase 2 will compute this from the share price.
  sharesOutMin?: bigint
}) =>
  encodeFunctionData({
    abi: routerAbi,
    args: [asset, amount, sharesOutMin, receiver, automatic, fulfillmentFee],
    functionName: 'requestDeposit',
  })

export const encodeRequestRedeem = ({
  asset,
  assetsOutMin = BigInt(0),
  automatic = true,
  fulfillmentFee,
  receiver,
  shares,
}: {
  asset: Address
  // Minimum underlying assets accepted on fulfillment (slippage protection
  // enforced on the remote chain). Defaults to `0n` until the share → asset
  // conversion is wired up; phase 2 will compute this from the share price.
  assetsOutMin?: bigint
  automatic?: boolean
  fulfillmentFee: bigint
  receiver: Address
  shares: bigint
}) =>
  encodeFunctionData({
    abi: routerAbi,
    args: [asset, shares, assetsOutMin, receiver, automatic, fulfillmentFee],
    functionName: 'requestRedeem',
  })
