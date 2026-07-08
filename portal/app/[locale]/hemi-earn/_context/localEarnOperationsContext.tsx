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

import { hashesMatch } from '../_utils'
import { type EarnSettlement, type LocalEarnOperation } from '../types'

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
  // Soft-delete (settled:true) the entry matching initiateTxHash, scoped to the
  // connected wallet; the entry stays so the drawer can still read its local metadata.
  markSettledByInitiateTxHash: (initiateTxHash: Hash) => void
  // Records/clears the claim/recover marker on the matching entry; no-op if the request has no local entry.
  setSettlement: (
    initiateTxHash: Hash,
    settlement: EarnSettlement | undefined,
  ) => void
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

// Key by initiateTxHash once known; before that, the (account, startedAt) tuple identifies the signing session.
const matchesExisting = function (
  entry: LocalEarnOperation,
  payload: UpsertPayload,
): boolean {
  if (payload.initiateTxHash && entry.initiateTxHash) {
    return hashesMatch(entry.initiateTxHash, payload.initiateTxHash)
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

  const setSettlement = useCallback(
    function (initiateTxHash: Hash, settlement: EarnSettlement | undefined) {
      if (!address) return
      const targetAccount = normalizeAccount(address)
      setStore(function (prev) {
        const accountEntries = prev[targetAccount]
        if (!accountEntries) return prev
        const needle = initiateTxHash.toLowerCase()
        let mutated = false
        const updated = accountEntries.map(function (e) {
          if (e.initiateTxHash?.toLowerCase() !== needle) return e
          mutated = true
          return { ...e, settlement }
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
      setSettlement,
      upsertLocalOperation,
    }),
    [
      clearForAccount,
      localOperations,
      markSettledByInitiateTxHash,
      setSettlement,
      upsertLocalOperation,
    ],
  )

  return (
    <LocalEarnOperationsContext.Provider value={value}>
      {children}
    </LocalEarnOperationsContext.Provider>
  )
}
