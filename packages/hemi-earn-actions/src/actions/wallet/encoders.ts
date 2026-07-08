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
  // Authorized to call Agent.cancel on the remote chain; reverts if 0x0.
  operator: Address
  receiver: Address
  // Min shares accepted on fulfillment (slippage, enforced remotely); 0n disables it.
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
  // Min assets accepted on fulfillment (slippage, enforced remotely); 0n disables it.
  assetsOutMin?: bigint
  automatic?: boolean
  callbackFee: bigint
  // Instant vs cooldown path; must match the vault state (resolveIsInstant) or the Agent cancels.
  isInstant: boolean
  // Authorized to call Router.cancel for cooldown redeems; reverts if 0x0.
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
