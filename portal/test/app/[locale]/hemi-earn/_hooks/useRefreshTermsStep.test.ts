import { useQueryClient } from '@tanstack/react-query'
import { useRefreshTermsStep } from 'app/[locale]/hemi-earn/_hooks/useRefreshTermsStep'
import { useNetworkType } from 'hooks/useNetworkType'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAccount, useBytecode, useConfig } from 'wagmi'
import { getAccount } from 'wagmi/actions'

vi.mock('@tanstack/react-query', () => ({ useQueryClient: vi.fn() }))
vi.mock('hooks/useNetworkType', () => ({ useNetworkType: vi.fn() }))
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useBytecode: vi.fn(),
  useConfig: vi.fn(),
}))
vi.mock('wagmi/actions', () => ({ getAccount: vi.fn() }))
vi.mock('app/[locale]/hemi-earn/_hooks/useHemiEarnTerms', () => ({
  hemiEarnTermsQueryOptions: () => ({ queryKey: ['terms'] }),
}))
vi.mock('app/[locale]/hemi-earn/_hooks/useHemiEarnTermsAcceptance', () => ({
  hemiEarnTermsAcceptanceQueryOptions: () => ({ queryKey: ['acceptance'] }),
}))

const account = '0x0000000000000000000000000000000000000001'
const otherAccount = '0x0000000000000000000000000000000000000002'
const termsVersion = '1'

// Runs onFetch while the requests are in flight
const mockFetchQuery = (onFetch = () => undefined) =>
  vi.fn(function ({ queryKey }) {
    onFetch()
    return Promise.resolve(
      queryKey[0] === 'terms' ? { termsVersion } : termsVersion,
    )
  })

describe('useRefreshTermsStep', function () {
  beforeEach(function () {
    vi.mocked(useAccount).mockReturnValue({ address: account })
    vi.mocked(useBytecode).mockReturnValue({ data: undefined })
    vi.mocked(useConfig).mockReturnValue({})
    vi.mocked(useNetworkType).mockReturnValue(['mainnet'])
    vi.mocked(getAccount).mockReturnValue({ address: account })
  })

  it('should return the step when the wallet is unchanged after the requests', async function () {
    vi.mocked(useQueryClient).mockReturnValue({ fetchQuery: mockFetchQuery() })

    const step = await useRefreshTermsStep()()

    expect(step).toBe('accepted')
  })

  it('should return undefined when the wallet is switched during the requests', async function () {
    vi.mocked(useQueryClient).mockReturnValue({
      fetchQuery: mockFetchQuery(function () {
        vi.mocked(getAccount).mockReturnValue({ address: otherAccount })
      }),
    })

    const step = await useRefreshTermsStep()()

    expect(step).toBeUndefined()
  })

  it('should return undefined when the wallet is disconnected during the requests', async function () {
    vi.mocked(useQueryClient).mockReturnValue({
      fetchQuery: mockFetchQuery(function () {
        vi.mocked(getAccount).mockReturnValue({ address: undefined })
      }),
    })

    const step = await useRefreshTermsStep()()

    expect(step).toBeUndefined()
  })
})
