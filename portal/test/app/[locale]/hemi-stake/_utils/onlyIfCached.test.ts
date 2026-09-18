import { QueryClient } from '@tanstack/react-query'
import { onlyIfCached } from 'app/[locale]/hemi-stake/_utils/onlyIfCached'
import type { TransactionReceipt } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryKey = ['nativeBalance', 743111, '0xholder']
const receipt = {
  effectiveGasPrice: BigInt(1),
  gasUsed: BigInt(21_000),
  status: 'success',
} as TransactionReceipt

describe('onlyIfCached', function () {
  let queryClient: QueryClient

  beforeEach(function () {
    queryClient = new QueryClient()
  })

  it('updates when the key holds a value', function () {
    queryClient.setQueryData(queryKey, BigInt(5))
    const update = vi.fn()

    onlyIfCached(queryClient, queryKey, update)(receipt)

    expect(update).toHaveBeenCalledWith(receipt)
  })

  it('updates when the cached value is falsy but present', function () {
    queryClient.setQueryData(queryKey, BigInt(0))
    const update = vi.fn()

    onlyIfCached(queryClient, queryKey, update)(receipt)

    expect(update).toHaveBeenCalledOnce()
  })

  it('skips when the key was never written', function () {
    const update = vi.fn()

    onlyIfCached(queryClient, queryKey, update)(receipt)

    expect(update).not.toHaveBeenCalled()
  })

  it('skips after the entry is removed', function () {
    queryClient.setQueryData(queryKey, BigInt(5))
    queryClient.removeQueries({ exact: true, queryKey })
    const update = vi.fn()

    onlyIfCached(queryClient, queryKey, update)(receipt)

    expect(update).not.toHaveBeenCalled()
  })

  it('skips for a query that errored, which caches no data', async function () {
    await queryClient
      .fetchQuery({
        queryFn: () => Promise.reject(new Error('rpc is down')),
        queryKey,
        retry: false,
      })
      .catch(() => undefined)
    const update = vi.fn()

    onlyIfCached(queryClient, queryKey, update)(receipt)

    expect(update).not.toHaveBeenCalled()
  })

  // What the guard exists for: the listener must not throw, or the action's own try
  // swallows it and abandons the rest of the operation.
  it('does not throw when the helper would dereference a missing entry', function () {
    const update = function () {
      const cached = queryClient.getQueryData(queryKey) as
        | { value: bigint }
        | undefined
      return cached!.value
    }

    expect(() =>
      onlyIfCached(queryClient, queryKey, update)(receipt),
    ).not.toThrow()
  })

  it('reads the key it was given, not another one', function () {
    queryClient.setQueryData(['nativeBalance', 1, '0xother'], BigInt(5))
    const update = vi.fn()

    onlyIfCached(queryClient, queryKey, update)(receipt)

    expect(update).not.toHaveBeenCalled()
  })
})
