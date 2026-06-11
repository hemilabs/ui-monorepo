import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { depositPreviewOptions } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchDepositPreview'

const account = '0x3333333333333333333333333333333333333333' as Address
const asset = '0x1111111111111111111111111111111111111111' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address

vi.mock(
  '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchDepositShares',
  () => ({
    depositSharesOptions: () => ({
      queryKey: ['hemi-earn', 'deposit-shares'],
    }),
  }),
)

vi.mock(
  '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchQuoteDeposit',
  () => ({
    quoteDepositOptions: () => ({ queryKey: ['hemi-earn', 'quote-deposit'] }),
  }),
)

const createQueryClient = (shares: bigint) => ({
  ensureQueryData: vi.fn(function ({ queryKey }) {
    switch (queryKey[1]) {
      case 'deposit-shares':
        return Promise.resolve(shares)
      case 'quote-deposit':
        return Promise.resolve({
          callbackFee: BigInt(7),
          nativeFee: BigInt(9),
          peggedAmount: BigInt(500),
        })
      default:
        return Promise.reject(
          new Error(`unexpected query ${String(queryKey[1])}`),
        )
    }
  }),
})

describe('depositPreviewOptions', function () {
  const baseParams = {
    account,
    amount: BigInt(1000),
    asset,
    shareAddress,
    validInput: true,
  }

  it('composes deposit-shares + quote in parallel and derives slippage', async function () {
    const queryClient = createQueryClient(BigInt(800))
    const options = depositPreviewOptions({
      ...baseParams,
      queryClient: queryClient as never,
    })
    const result = (await options.queryFn!({} as never)) as {
      quote: { callbackFee: bigint; nativeFee: bigint; peggedAmount: bigint }
      shares: bigint
      sharesOutMin: bigint
    }

    expect(result.shares).toBe(BigInt(800))
    // applySlippage with DEPOSIT_SLIPPAGE_BPS=50 (0.5%): 800 * 0.995 = 796
    expect(result.sharesOutMin).toBe(BigInt(796))
    expect(result.quote.nativeFee).toBe(BigInt(9))
    expect(queryClient.ensureQueryData).toHaveBeenCalledTimes(2)
  })

  it('is disabled when validInput is false', function () {
    const options = depositPreviewOptions({
      ...baseParams,
      queryClient: createQueryClient(BigInt(0)) as never,
      validInput: false,
    })
    expect(options.enabled).toBe(false)
  })

  it('is disabled when account is undefined', function () {
    const options = depositPreviewOptions({
      ...baseParams,
      account: undefined,
      queryClient: createQueryClient(BigInt(0)) as never,
    })
    expect(options.enabled).toBe(false)
  })
})
