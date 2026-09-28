import { type EvmToken } from 'types/token'
import {
  type Address,
  encodeAbiParameters,
  keccak256,
  maxUint256,
  toHex,
} from 'viem'

const allowancesSlot = BigInt(1)

export const createErc20AllowanceStateOverride = function ({
  owner,
  spender,
  token,
}: {
  owner: Address | undefined
  spender: Address
  token: EvmToken
}) {
  if (!owner) {
    return undefined
  }
  const ownerSlot = keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [owner, allowancesSlot],
    ),
  )
  const slot = keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [spender, ownerSlot],
    ),
  )
  return [
    {
      address: token.address as Address,
      stateDiff: [{ slot, value: toHex(maxUint256, { size: 32 }) }],
    },
  ]
}
