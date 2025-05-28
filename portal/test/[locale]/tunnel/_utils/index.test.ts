import { validateSubmit } from 'app/[locale]/tunnel/_utils'
import * as tokenInputUtils from 'components/tokenInput/utils'
import { describe, it, expect, vi, afterEach } from 'vitest'

// Minimal mock for t, matching only the required signature for the test
const t = (key: string) => key

const baseArgs = {
  balance: BigInt(100),
  chainId: 1,
  expectedChain: 'Ethereum',
  t,
  token: { chainId: 1, decimals: 18 },
}

describe('validateSubmit', function () {
  afterEach(function () {
    vi.clearAllMocks()
  })

  it('returns canSubmit: true when input is valid and chain matches', function () {
    vi.spyOn(tokenInputUtils, 'validateInput').mockReturnValue({
      errorKey: undefined,
      isValid: true,
    })
    const result = validateSubmit(baseArgs)
    expect(result).toEqual({
      canSubmit: true,
      error: undefined,
      errorKey: undefined,
    })
  })

  it('returns canSubmit: false and error from validateInput when input is invalid', function () {
    vi.spyOn(tokenInputUtils, 'validateInput').mockReturnValue({
      error: 'Invalid',
      errorKey: 'enter-an-amount',
      isValid: false,
    })
    const result = validateSubmit(baseArgs)
    expect(result).toEqual({
      canSubmit: false,
      error: 'Invalid',
      errorKey: 'enter-an-amount',
    })
  })

  it('returns canSubmit: false and error for wrong chain', function () {
    vi.spyOn(tokenInputUtils, 'validateInput').mockReturnValue({
      errorKey: undefined,
      isValid: true,
    })
    const args = { ...baseArgs, chainId: 2 }
    const result = validateSubmit(args)
    expect(result).toEqual({
      canSubmit: false,
      error: 'common.connect-to-network',
      errorKey: 'connect-to-network',
    })
  })
})
