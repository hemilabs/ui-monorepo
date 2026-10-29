import { type EvmToken } from 'types/token'
import { createErc20AllowanceStateOverride } from 'utils/erc20StateOverride'
import { type Address, maxUint256 } from 'viem'

export const createFeeEstimateStateOverride = function ({
  needsApproval,
  owner,
  spender,
  token,
}: {
  needsApproval: boolean
  owner: Address | undefined
  spender: Address
  token: EvmToken
}) {
  if (!owner) {
    return undefined
  }
  return [
    { address: owner, balance: maxUint256 },
    ...(createErc20AllowanceStateOverride({
      enabled: needsApproval,
      owner,
      spender,
      token,
    }) ?? []),
  ]
}
