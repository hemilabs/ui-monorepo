'use client'

import { hemi } from 'hemi-viem'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type Address, type Hash } from 'viem'
import { useAccount } from 'wagmi'

import { useEarnTransactionsQuery } from '../_hooks/useEarnTransactionsQuery'
import { PoolToast } from '../pool/[shareAddress]/_components/poolToast'
import { type EarnTransactionKindType } from '../types'

// Match the <Toast> primitive's 10s auto-close so its close animation isn't cut short.
const TOAST_MS = 10_000

type Props = {
  kind: EarnTransactionKindType
  title: string
}

// Toasts when a request reaches FINALIZED (cross-chain complete). Snapshots the
// already-finalized hashes on first render so a session with historical rows doesn't fire a burst.
export const EarnSuccessToast = function ({ kind, title }: Props) {
  const { address } = useAccount()
  const { data } = useEarnTransactionsQuery()

  const seenFinalizedOnMountRef = useRef<Set<string> | null>(null)
  // Hashes already shown; without this the toast would re-open each poll (newClaim keeps returning the same FINALIZED row).
  const shownRef = useRef<Set<string>>(new Set())
  // Session-scoped refs guarding account-scoped data — wipe on wallet change so A's hashes don't fire false toasts for B.
  const snapshotAccountRef = useRef<Address | undefined>(undefined)
  if (snapshotAccountRef.current !== address) {
    seenFinalizedOnMountRef.current = null
    shownRef.current = new Set()
    snapshotAccountRef.current = address
  }

  if (seenFinalizedOnMountRef.current === null && data !== undefined) {
    seenFinalizedOnMountRef.current = new Set(
      data
        .filter(tx => tx.kind === kind && tx.status === 'FINALIZED')
        .map(tx => tx.requestTxHash.toLowerCase()),
    )
  }

  const newClaim = useMemo(
    function () {
      const snapshot = seenFinalizedOnMountRef.current
      if (!data || snapshot === null) return undefined
      const fresh = data
        .filter(
          tx =>
            tx.kind === kind &&
            tx.status === 'FINALIZED' &&
            !!tx.claimTxHash &&
            !snapshot.has(tx.requestTxHash.toLowerCase()),
        )
        .sort((a, b) => Number(b.requestedAt) - Number(a.requestedAt))
      return fresh[0]
    },
    [data, kind],
  )

  const [latched, setLatched] = useState<{
    claimTxHash: Hash
    requestTxHash: Hash
  } | null>(null)

  useEffect(
    function latchOnNewClaim() {
      if (!newClaim?.claimTxHash) return
      const hash = newClaim.requestTxHash.toLowerCase()
      if (shownRef.current.has(hash)) return
      shownRef.current.add(hash)
      setLatched({
        claimTxHash: newClaim.claimTxHash,
        requestTxHash: newClaim.requestTxHash,
      })
    },
    [newClaim?.claimTxHash, newClaim?.requestTxHash],
  )

  const latchedKey = latched?.requestTxHash
  useEffect(
    function unlatchAfterToastWindow() {
      if (latchedKey === undefined) return undefined
      const timer = setTimeout(() => setLatched(null), TOAST_MS)
      return () => clearTimeout(timer)
    },
    [latchedKey],
  )

  if (!latched) return null

  return (
    <PoolToast
      chainId={hemi.id}
      key={latched.requestTxHash}
      title={title}
      transactionHash={latched.claimTxHash}
    />
  )
}
