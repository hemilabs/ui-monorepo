import { type Hex, decodeErrorResult } from 'viem'

export type FailureCategory = 'gas' | 'slippage' | 'unknown'

// Vetro enforces min-out on the gateway, so a slippage revert surfaces as Error(string)
// with one of these in its message; a custom Vetro error we can't name falls through to 'unknown'.
const slippageMessage =
  /slippage|amount.?out|min.?(amount|out)|insufficient.{0,4}output|too little received/i

// Agent.sol reverts InsufficientFee when the forwarded nativeFee can't cover the return message.
const agentErrorsAbi = [
  {
    inputs: [
      { name: 'provided', type: 'uint256' },
      { name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientFee',
    type: 'error',
  },
] as const

// Return type pinned so TS keeps the literal union (it widens inferred literal returns to `string`).
export const decodeFailureReason = function (
  reason: string | null | undefined,
): FailureCategory {
  // Empty returndata is an out-of-gas / bare revert — retrying with more gas is the safe default.
  if (!reason || reason === '0x' || reason.length < 10) return 'gas'

  let decoded
  try {
    decoded = decodeErrorResult({ abi: agentErrorsAbi, data: reason as Hex })
  } catch {
    return 'unknown'
  }

  if (decoded.errorName === 'InsufficientFee') return 'gas'
  if (decoded.errorName === 'Error') {
    return slippageMessage.test(String(decoded.args?.[0] ?? ''))
      ? 'slippage'
      : 'unknown'
  }
  return 'unknown'
}
