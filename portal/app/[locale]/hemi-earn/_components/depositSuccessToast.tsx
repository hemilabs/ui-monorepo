'use client'

import { hemi } from 'hemi-viem'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type Address, type Hash } from 'viem'
import { useAccount } from 'wagmi'

import { useEarnTransactionsQuery } from '../_hooks/useEarnTransactionsQuery'
import { PoolToast } from '../pool/[shareAddress]/_components/poolToast'

// Visible window before the toast unmounts. Matches the `<Toast>` primitive's
// own auto-close (10s) so the inner close-animation isn't cut short.
const TOAST_MS = 10_000

// Fires when a deposit reaches the subgraph `CLAIMED` state — the moment
// the full cross-chain flow completes and the shares actually land on the
// user's wallet. Mounted once at the hemi-earn layout level so it survives
// navigation between the pool page and the home page.
//
// To avoid noise on first mount (a session with historical CLAIMED rows),
// the component snapshots the already-claimed hashes on the first non-
// empty render and only latches the toast for rows that become CLAIMED
// after that.
export const DepositSuccessToast = function () {
  const { address } = useAccount()
  const { data } = useEarnTransactionsQuery()
  const t = useTranslations('hemi-earn.pool')

  const seenClaimedOnMountRef = useRef<Set<string> | null>(null)
  // Hashes already surfaced this session. Without this ref the toast would
  // re-open after the `TOAST_MS` window because `newClaim` keeps returning
  // the same CLAIMED row from the subgraph poll.
  const shownRef = useRef<Set<string>>(new Set())
  // Both refs are session-scoped state but the data they guard is account-
  // scoped. Wipe them when the connected wallet changes so account A's
  // hashes don't leak into account B's polling loop (otherwise every
  // historical CLAIMED on account B fires a false toast right after the
  // wallet swap).
  const snapshotAccountRef = useRef<Address | undefined>(undefined)
  if (snapshotAccountRef.current !== address) {
    seenClaimedOnMountRef.current = null
    shownRef.current = new Set()
    snapshotAccountRef.current = address
  }

  if (seenClaimedOnMountRef.current === null && data !== undefined) {
    seenClaimedOnMountRef.current = new Set(
      data
        .filter(tx => tx.kind === 'DEPOSIT' && tx.status === 'CLAIMED')
        .map(tx => tx.initiateTxHash.toLowerCase()),
    )
  }

  const newClaim = useMemo(
    function () {
      const snapshot = seenClaimedOnMountRef.current
      if (!data || snapshot === null) return undefined
      const fresh = data
        .filter(
          tx =>
            tx.kind === 'DEPOSIT' &&
            tx.status === 'CLAIMED' &&
            !!tx.claimTxHash &&
            !snapshot.has(tx.initiateTxHash.toLowerCase()),
        )
        .sort((a, b) => Number(b.initiatedAt) - Number(a.initiatedAt))
      return fresh[0]
    },
    [data],
  )

  const [latched, setLatched] = useState<{
    claimTxHash: Hash
    initiateTxHash: Hash
  } | null>(null)

  useEffect(
    function latchOnNewClaim() {
      if (!newClaim?.claimTxHash) return
      const hash = newClaim.initiateTxHash.toLowerCase()
      if (shownRef.current.has(hash)) return
      shownRef.current.add(hash)
      setLatched({
        claimTxHash: newClaim.claimTxHash,
        initiateTxHash: newClaim.initiateTxHash,
      })
    },
    [newClaim?.claimTxHash, newClaim?.initiateTxHash],
  )

  const latchedKey = latched?.initiateTxHash
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
      key={latched.initiateTxHash}
      title={t('deposit-successful')}
      transactionHash={latched.claimTxHash}
    />
  )
}
