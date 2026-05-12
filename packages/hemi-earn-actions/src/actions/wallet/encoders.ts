import { type Address, encodeFunctionData } from 'viem'

import { routerAbi } from '../../abi'

export const encodeRequestDeposit = ({
  amount,
  asset,
  automatic = true,
  fulfillmentFee,
  receiver,
}: {
  amount: bigint
  asset: Address
  automatic?: boolean
  fulfillmentFee: bigint
  receiver: Address
}) =>
  encodeFunctionData({
    abi: routerAbi,
    args: [asset, amount, receiver, automatic, fulfillmentFee],
    functionName: 'requestDeposit',
  })

export const encodeRequestRedeem = ({
  asset,
  automatic = true,
  fulfillmentFee,
  receiver,
  shares,
}: {
  asset: Address
  automatic?: boolean
  fulfillmentFee: bigint
  receiver: Address
  shares: bigint
}) =>
  encodeFunctionData({
    abi: routerAbi,
    args: [asset, shares, receiver, automatic, fulfillmentFee],
    functionName: 'requestRedeem',
  })
