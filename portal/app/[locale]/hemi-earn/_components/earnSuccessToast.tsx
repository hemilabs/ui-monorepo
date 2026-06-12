'use client'

import { hemi } from 'hemi-viem'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type Address, type Hash } from 'viem'
import { useAccount } from 'wagmi'

import { useEarnTransactionsQuery } from '../_hooks/useEarnTransactionsQuery'
import { PoolToast } from '../pool/[shareAddress]/_components/poolToast'
import { type EarnTransactionKindType } from '../types'

// Visible window before the toast unmounts. Matches the `<Toast>` primitive's
// own auto-close (10s) so the inner close-animation isn't cut short.
const TOAST_MS = 10_000

type Props = {
  // Subgraph kind to watch — `DEPOSIT` for the shares-landing toast,
  // `REDEEM` for the underlying-received toast. Each consumer mounts its
  // own instance with the matching kind + title.
  kind: EarnTransactionKindType
  title: string
}

// Fires when a request reaches the subgraph `FINALIZED` state — the moment
// the full cross-chain flow completes (share OFTs landing on the user's
// Hemi wallet for deposits, underlying tokens landing on the user's Hemi
// wallet for redeems). Mounted once per kind at the hemi-earn layout
// level so it survives navigation between the pool page and the home
// page.
//
// To avoid noise on first mount (a session with historical FINALIZED rows),
// the component snapshots the already-finalized hashes on the first non-
// empty render and only latches the toast for rows that become FINALIZED
// after that.
export const EarnSuccessToast = function ({ kind, title }: Props) {
  const { address } = useAccount()
  const { data } = useEarnTransactionsQuery()

  const seenFinalizedOnMountRef = useRef<Set<string> | null>(null)
  // Hashes already surfaced this session. Without this ref the toast would
  // re-open after the `TOAST_MS` window because `newClaim` keeps returning
  // the same FINALIZED row from the subgraph poll.
  const shownRef = useRef<Set<string>>(new Set())
  // Both refs are session-scoped state but the data they guard is account-
  // scoped. Wipe them when the connected wallet changes so account A's
  // hashes don't leak into account B's polling loop (otherwise every
  // historical FINALIZED on account B fires a false toast right after the
  // wallet swap).
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
