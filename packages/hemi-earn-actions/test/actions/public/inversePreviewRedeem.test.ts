import { previewRedeem } from '@vetro-protocol/gateway/actions'
import { type Address, type Client, zeroAddress } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { inversePreviewRedeem } from '../../../src/actions/public/inversePreviewRedeem'

// Mock the upstream package action directly. With pnpm's isolated modules,
// mocking `viem/actions` doesn't reach the copy of `readContract` imported
// by `@vetro-protocol/gateway/actions`, so we intercept at the action layer
// the SUT actually calls.
vi.mock('@vetro-protocol/gateway/actions', () => ({
  previewRedeem: vi.fn(),
}))

const client = {} as Client
const gatewayAddress = '0x000000000000000000000000000000000000beef' as Address
const tokenOut = '0x000000000000000000000000000000000000dead' as Address

describe('inversePreviewRedeem', function () {
  it('probes previewRedeem at amount and inverts the linear relationship', async function () {
    // 0.2% redeemFee scenario: previewRedeem(asset, X) = X * 9980 / 10000.
    // Probe at amount=10000 → contract returns 9980. We need the smallest
    // peggedIn whose redeem covers 10000 asset out: peggedIn = ceil(amount²
    // / probe) = ceil(100_000_000 / 9980) = 10021 (10020.04...).
    // At 10020 the redeem would only return 9999 (floor of 10020*9980/10000),
    // so the ceil step is what guarantees the UX promise.
    vi.mocked(previewRedeem).mockResolvedValue(BigInt(9980))

    const result = await inversePreviewRedeem({
      amount: BigInt(10000),
      client,
      gatewayAddress,
      tokenOut,
    })

    expect(result).toBe(BigInt(10021))
    expect(previewRedeem).toHaveBeenCalledWith(client, {
      address: gatewayAddress,
      peggedTokenIn: BigInt(10000),
      tokenOut,
    })
  })

  it('returns amount unchanged when the gateway has no fee', async function () {
    // Anvil mock with redeemRateBps = 10000 → probe == amount → peggedIn == amount.
    vi.mocked(previewRedeem).mockResolvedValue(BigInt(1_000_000))

    const result = await inversePreviewRedeem({
      amount: BigInt(1_000_000),
      client,
      gatewayAddress,
      tokenOut,
    })

    expect(result).toBe(BigInt(1_000_000))
  })

  it('returns zero when previewRedeem returns zero', async function () {
    // Gateway disabled / asset blocked — caller can gate the UI on `0n`.
    vi.mocked(previewRedeem).mockResolvedValue(BigInt(0))

    const result = await inversePreviewRedeem({
      amount: BigInt(1_000),
      client,
      gatewayAddress,
      tokenOut,
    })

    expect(result).toBe(BigInt(0))
  })

  // Input validation (zero addresses, non-positive amount) is delegated to
  // `previewRedeem` from `@vetro-protocol/gateway` — that action throws
  // before reaching our ceiling-division logic. Coverage for the validation
  // itself lives upstream in the gateway package's tests; here we just
  // assert errors from the action surface through unchanged.
  it('propagates validation errors from previewRedeem', async function () {
    vi.mocked(previewRedeem).mockRejectedValue(new Error('Gateway is invalid'))

    await expect(
      inversePreviewRedeem({
        amount: BigInt(1),
        client,
        gatewayAddress: zeroAddress,
        tokenOut,
      }),
    ).rejects.toThrow(/Gateway is invalid/)
  })
})
