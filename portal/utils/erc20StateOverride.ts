import { type EvmToken } from 'types/token'
import {
  type Address,
  encodeAbiParameters,
  keccak256,
  maxUint256,
  toHex,
} from 'viem'

// The OpenZeppelin ERC20 layout, for tokens the list carries no slot for
const defaultAllowancesSlot = 1

const toAllowancesSlot = function (slot: number | undefined) {
  if (slot === undefined || !Number.isInteger(slot) || slot < 0) {
    return BigInt(defaultAllowancesSlot)
  }
  return BigInt(slot)
}

export const createErc20AllowanceStateOverride = function ({
  enabled = true,
  owner,
  spender,
  token,
}: {
  enabled?: boolean
  owner: Address | undefined
  spender: Address
  token: EvmToken
}) {
  if (!enabled || !owner) {
    return undefined
  }
  const ownerSlot = keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [owner, toAllowancesSlot(token.extensions?.allowanceSlot)],
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
