import { type Address, encodeFunctionData } from 'viem'

import { routerAbi } from '../../routerAbi'

const encodeRouterRequestIdCall = (
  functionName:
    | 'claimDeposit'
    | 'claimRedeem'
    | 'recoverDeposit'
    | 'recoverRedeem',
  requestId: bigint,
) => encodeFunctionData({ abi: routerAbi, args: [requestId], functionName })

export const encodeClaimDeposit = ({ requestId }: { requestId: bigint }) =>
  encodeRouterRequestIdCall('claimDeposit', requestId)

export const encodeClaimRedeem = ({ requestId }: { requestId: bigint }) =>
  encodeRouterRequestIdCall('claimRedeem', requestId)

export const encodeRecoverDeposit = ({ requestId }: { requestId: bigint }) =>
  encodeRouterRequestIdCall('recoverDeposit', requestId)

export const encodeRecoverRedeem = ({ requestId }: { requestId: bigint }) =>
  encodeRouterRequestIdCall('recoverRedeem', requestId)

export const encodeRequestDeposit = ({
  amount,
  asset,
  automatic = true,
  callbackFee,
  operator,
  receiver,
  sharesOutMin = BigInt(0),
}: {
  amount: bigint
  asset: Address
  automatic?: boolean
  callbackFee: bigint
  // Address authorized to call `Agent.cancel(id)` on the remote chain.
  // Contract reverts with `ZeroAddress` if `0x0` is passed.
  operator: Address
  receiver: Address
  // Minimum shares accepted on fulfillment (slippage protection enforced
  // on the remote chain). Defaults to `0n` until the asset → shares
  // conversion is wired up; phase 2 will compute this from the share price.
  sharesOutMin?: bigint
}) =>
  encodeFunctionData({
    abi: routerAbi,
    args: [
      asset,
      amount,
      sharesOutMin,
      receiver,
      operator,
      automatic,
      callbackFee,
    ],
    functionName: 'requestDeposit',
  })

export const encodeRequestRedeem = ({
  asset,
  assetsOutMin = BigInt(0),
  automatic = true,
  callbackFee,
  isInstant,
  operator,
  receiver,
  shares,
}: {
  asset: Address
  // Minimum underlying assets accepted on fulfillment (slippage protection
  // enforced on the remote chain). Defaults to `0n` until the share → asset
  // conversion is wired up; phase 2 will compute this from the share price.
  assetsOutMin?: bigint
  automatic?: boolean
  callbackFee: bigint
  // Declares the redeem path (instant vs cooldown). Must match the vault's
  // actual state for the caller — resolve via `resolveIsInstant` before
  // calling. A mismatch causes the Agent to send an immediate cancel.
  isInstant: boolean
  // Address authorized to call `Router.cancel(id)` for cooldown redeems.
  // Contract reverts with `ZeroAddress` if `0x0` is passed.
  operator: Address
  receiver: Address
  shares: bigint
}) =>
  encodeFunctionData({
    abi: routerAbi,
    args: [
      asset,
      shares,
      assetsOutMin,
      receiver,
      operator,
      automatic,
      callbackFee,
      isInstant,
    ],
    functionName: 'requestRedeem',
  })
