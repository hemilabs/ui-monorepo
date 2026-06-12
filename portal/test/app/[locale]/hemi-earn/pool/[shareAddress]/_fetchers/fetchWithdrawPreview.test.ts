import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { withdrawPreviewOptions } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchWithdrawPreview'

const account = '0x3333333333333333333333333333333333333333' as Address
const asset = '0x1111111111111111111111111111111111111111' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address

vi.mock(
  '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchSharesToAssets',
  () => ({
    sharesToAssetsOptions: () => ({
      queryKey: ['hemi-earn', 'shares-to-assets'],
    }),
  }),
)

vi.mock(
  '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchQuoteRedeem',
  () => ({
    quoteRedeemOptions: () => ({ queryKey: ['hemi-earn', 'quote-redeem'] }),
  }),
)

const createQueryClient = ({
  assetOut,
  peggedAmount,
}: {
  assetOut: bigint
  peggedAmount: bigint
}) => ({
  ensureQueryData: vi.fn(function ({ queryKey }) {
    switch (queryKey[1]) {
      case 'shares-to-assets':
        return Promise.resolve({ assetOut, peggedAmount })
      case 'quote-redeem':
        return Promise.resolve({
          callbackFee: BigInt(7),
          isInstant: false,
          nativeFee: BigInt(9),
        })
      default:
        return Promise.reject(
          new Error(`unexpected query ${String(queryKey[1])}`),
        )
    }
  }),
})

describe('withdrawPreviewOptions', function () {
  const baseParams = {
    account,
    asset,
    shareAddress,
    shares: BigInt(1000),
    validInput: true,
  }

  it('composes sharesToAssets + quote in parallel and derives slippage', async function () {
    const queryClient = createQueryClient({
      assetOut: BigInt(900),
      peggedAmount: BigInt(950),
    })
    const options = withdrawPreviewOptions({
      ...baseParams,
      queryClient: queryClient as never,
    })
    const result = (await options.queryFn!({} as never)) as {
      assetOut: bigint
      assetsOutMin: bigint
      peggedAmount: bigint
      quote: { callbackFee: bigint; isInstant: boolean; nativeFee: bigint }
    }

    expect(result.assetOut).toBe(BigInt(900))
    expect(result.peggedAmount).toBe(BigInt(950))
    // applySlippage with REDEEM_SLIPPAGE_BPS=100 (1%): 900 * 0.99 = 891
    expect(result.assetsOutMin).toBe(BigInt(891))
    expect(result.quote.nativeFee).toBe(BigInt(9))
    expect(queryClient.ensureQueryData).toHaveBeenCalledTimes(2)
  })

  it('is disabled when validInput is false', function () {
    const options = withdrawPreviewOptions({
      ...baseParams,
      queryClient: createQueryClient({
        assetOut: BigInt(0),
        peggedAmount: BigInt(0),
      }) as never,
      validInput: false,
    })
    expect(options.enabled).toBe(false)
  })

  it('is disabled when account is undefined', function () {
    const options = withdrawPreviewOptions({
      ...baseParams,
      account: undefined,
      queryClient: createQueryClient({
        assetOut: BigInt(0),
        peggedAmount: BigInt(0),
      }) as never,
    })
    expect(options.enabled).toBe(false)
  })
})
