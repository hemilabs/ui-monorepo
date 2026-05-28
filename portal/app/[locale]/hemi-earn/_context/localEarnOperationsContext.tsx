'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { type Address, type Hash } from 'viem'
import { useAccount } from 'wagmi'

import { type LocalEarnOperation } from '../types'

const STORAGE_KEY = 'hemi-earn:local-operations'
// Defensive: drop entries older than 90 days to avoid unbounded growth across
// browser sessions. Backed-up by a hard cap below. Unit matches
// `LocalEarnOperation.startedAt` (unix seconds) so the comparison in
// `garbageCollect` doesn't need to convert.
const TTL_SECONDS = 90 * 24 * 60 * 60
const MAX_ENTRIES_PER_ACCOUNT = 100

type Store = Record<string, LocalEarnOperation[]>

type UpsertPayload = Partial<LocalEarnOperation> & {
  account: Address
  kind: LocalEarnOperation['kind']
  startedAt: number
}

type LocalEarnOperationsContextValue = {
  clearForAccount: (account: Address) => void
  localOperations: LocalEarnOperation[]
  // Flags any entry whose `initiateTxHash` matches as `settled: true` so the
  // table hides it. Used by retry flows to supersede the specific prior
  // attempt the user is replacing (passed explicitly via `initiateTxHash`,
  // never inferred from `account`/`asset` — those could match unrelated
  // historical failures).
  markSettledByInitiateTxHash: (initiateTxHash: Hash) => void
  upsertLocalOperation: (payload: UpsertPayload) => void
}

export const LocalEarnOperationsContext = createContext<
  LocalEarnOperationsContextValue | undefined
>(undefined)

const isBrowser = () => typeof window !== 'undefined'

const readStore = function (): Store {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Store
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeStore = function (store: Store) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Quota exceeded or storage disabled — swallow; data is non-essential.
  }
}

const normalizeAccount = (account: Address) => account.toLowerCase() as Address

const garbageCollect = function (entries: LocalEarnOperation[]) {
  const nowSec = Math.floor(Date.now() / 1000)
  const recent = entries.filter(e => nowSec - e.startedAt < TTL_SECONDS)
  if (recent.length <= MAX_ENTRIES_PER_ACCOUNT) return recent
  // FIFO eviction: keep the most recent N by startedAt.
  return [...recent]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, MAX_ENTRIES_PER_ACCOUNT)
}

// Match an existing entry to update. Once we have an initiateTxHash, that's
// the canonical key; before that, the (account, startedAt) tuple identifies
// the user's signing session.
const matchesExisting = function (
  entry: LocalEarnOperation,
  payload: UpsertPayload,
): boolean {
  if (payload.initiateTxHash && entry.initiateTxHash) {
    return (
      entry.initiateTxHash.toLowerCase() ===
      payload.initiateTxHash.toLowerCase()
    )
  }
  return entry.startedAt === payload.startedAt
}

export const LocalEarnOperationsProvider = function ({
  children,
}: {
  children: ReactNode
}) {
  const { address } = useAccount()
  const [store, setStore] = useState<Store>(() => readStore())

  // Run GC on mount.
  useEffect(function gcOnMount() {
    setStore(function (prev) {
      const next: Store = {}
      let mutated = false
      for (const [account, entries] of Object.entries(prev)) {
        const collected = garbageCollect(entries)
        if (collected.length !== entries.length) mutated = true
        if (collected.length > 0) next[account] = collected
      }
      if (!mutated) return prev
      writeStore(next)
      return next
    })
  }, [])

  const upsertLocalOperation = useCallback(function (payload: UpsertPayload) {
    setStore(function (prev) {
      const account = normalizeAccount(payload.account)
      const existing = prev[account] ?? []
      const index = existing.findIndex(e => matchesExisting(e, payload))
      let nextEntries: LocalEarnOperation[]
      if (index >= 0) {
        const merged = {
          ...existing[index],
          ...payload,
          account,
          operation: {
            ...existing[index].operation,
            ...(payload.operation ?? {}),
          },
        } as LocalEarnOperation
        nextEntries = [...existing]
        nextEntries[index] = merged
      } else {
        // New entry — payload must carry the minimum shape; consumers (i.e.
        // `useDeposit`) populate the required fields on the first upsert.
        nextEntries = [
          ...existing,
          { ...payload, account } as LocalEarnOperation,
        ]
      }
      const next: Store = {
        ...prev,
        [account]: garbageCollect(nextEntries),
      }
      writeStore(next)
      return next
    })
  }, [])

  const clearForAccount = useCallback(function (account: Address) {
    setStore(function (prev) {
      const key = normalizeAccount(account)
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      writeStore(next)
      return next
    })
  }, [])

  const markSettledByInitiateTxHash = useCallback(
    function (initiateTxHash: Hash) {
      // Scope to the connected wallet — tx hashes are globally unique in
      // practice, but pinning to the current account prevents a hash-match
      // from accidentally touching another account's entries on a shared
      // device. Disconnected user → no-op (the retry flow can't run without
      // an active wallet anyway).
      if (!address) return
      const targetAccount = normalizeAccount(address)
      setStore(function (prev) {
        const accountEntries = prev[targetAccount]
        if (!accountEntries) return prev
        const needle = initiateTxHash.toLowerCase()
        let mutated = false
        function markIfMatch(e: LocalEarnOperation) {
          if (
            e.initiateTxHash?.toLowerCase() !== needle ||
            e.settled === true
          ) {
            return e
          }
          mutated = true
          return { ...e, settled: true }
        }
        const updated = accountEntries.map(markIfMatch)
        if (!mutated) return prev
        const next: Store = { ...prev, [targetAccount]: updated }
        writeStore(next)
        return next
      })
    },
    [address],
  )

  const localOperations = useMemo(
    function () {
      if (!address) return []
      return store[normalizeAccount(address)] ?? []
    },
    [address, store],
  )

  const value = useMemo<LocalEarnOperationsContextValue>(
    () => ({
      clearForAccount,
      localOperations,
      markSettledByInitiateTxHash,
      upsertLocalOperation,
    }),
    [
      clearForAccount,
      localOperations,
      markSettledByInitiateTxHash,
      upsertLocalOperation,
    ],
  )

  return (
    <LocalEarnOperationsContext.Provider value={value}>
      {children}
    </LocalEarnOperationsContext.Provider>
  )
}
