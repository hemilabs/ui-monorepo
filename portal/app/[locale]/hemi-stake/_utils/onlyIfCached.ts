import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { TransactionReceipt } from 'viem'

/**
 * Wraps an optimistic cache update so it is skipped when there is nothing cached to
 * update.
 *
 * `useUpdateNativeBalanceAfterReceipt` dereferences the cached value, and react-query
 * hands its updater `undefined` whenever the entry is missing - a read that errored, or
 * one garbage-collected after its last observer unmounted. The resulting TypeError
 * escapes the emitter listener that called it into the action's own try block; on the
 * capture-succeeded listener that abandons the unlock before the burn is ever sent.
 *
 * Skipping the write loses nothing. Every caller invalidates the same key in `onSettled`,
 * so a balance that was not in the cache is fetched fresh rather than patched.
 */
export const onlyIfCached = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  update: (receipt: TransactionReceipt) => void,
) =>
  function (receipt: TransactionReceipt) {
    if (queryClient.getQueryData(queryKey) === undefined) {
      return
    }
    update(receipt)
  }
