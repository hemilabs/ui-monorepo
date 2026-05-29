'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { type Address, type Hash } from 'viem'
import { useAccount } from 'wagmi'

import { type LocalEarnOperation } from '../types'

const STORAGE_KEY = 'hemi-earn:local-operations'
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

const normalizeAccount = (account: Address) => account.toLowerCase() as Address

const garbageCollect = function (entries: LocalEarnOperation[]) {
  const nowSec = Math.floor(Date.now() / 1000)
  const recent = entries.filter(e => nowSec - e.startedAt < TTL_SECONDS)
  if (recent.length <= MAX_ENTRIES_PER_ACCOUNT) return recent
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
  const [store, setStore] = useLocalStorageState<Store>(STORAGE_KEY, {
    defaultValue: {},
  })

  useEffect(
    function gcOnMount() {
      setStore(function (prev) {
        const next: Store = {}
        let mutated = false
        for (const [account, entries] of Object.entries(prev)) {
          const collected = garbageCollect(entries)
          if (collected.length !== entries.length) mutated = true
          if (collected.length > 0) next[account] = collected
        }
        return mutated ? next : prev
      })
    },
    [setStore],
  )

  const upsertLocalOperation = useCallback(
    function (payload: UpsertPayload) {
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
          nextEntries = [
            ...existing,
            { ...payload, account } as LocalEarnOperation,
          ]
        }
        return { ...prev, [account]: garbageCollect(nextEntries) }
      })
    },
    [setStore],
  )

  const clearForAccount = useCallback(
    function (account: Address) {
      setStore(function (prev) {
        const key = normalizeAccount(account)
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    [setStore],
  )

  const markSettledByInitiateTxHash = useCallback(
    function (initiateTxHash: Hash) {
      // Scope to the connected wallet — tx hashes are globally unique in
      // practice, but pinning to the current account prevents a hash-match
      // from accidentally touching another account's entries on a shared
      // device.
      if (!address) return
      const targetAccount = normalizeAccount(address)
      setStore(function (prev) {
        const accountEntries = prev[targetAccount]
        if (!accountEntries) return prev
        const needle = initiateTxHash.toLowerCase()
        let mutated = false
        const updated = accountEntries.map(function (e) {
          if (
            e.initiateTxHash?.toLowerCase() !== needle ||
            e.settled === true
          ) {
            return e
          }
          mutated = true
          return { ...e, settled: true }
        })
        if (!mutated) return prev
        return { ...prev, [targetAccount]: updated }
      })
    },
    [address, setStore],
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
