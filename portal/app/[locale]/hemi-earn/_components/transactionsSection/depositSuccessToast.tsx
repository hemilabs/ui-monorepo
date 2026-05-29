'use client'

import { hemi } from 'hemi-viem'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type Hash } from 'viem'

import { useLocalEarnOperations } from '../../_hooks/useLocalEarnOperations'
import { PoolToast } from '../../pool/[shareAddress]/_components/poolToast'
import { DepositStatus } from '../../pool/[shareAddress]/_types/operations'
import { isLocalEarnDeposit, type LocalEarnOperation } from '../../types'

// Visible window before the toast unmounts. Matches the `<Toast>` primitive's
// own auto-close (10s) so the inner close-animation isn't cut short.
const TOAST_MS = 10_000

// Mirrors the success toast that `<PoolForm>` shows on the pool page, but
// driven off the local-operations store so it fires for retries initiated
// from the home drawer too (`<RetryFailedDeposit>` doesn't sit inside
// `<PoolFormProvider>`, so the pool-side toast wouldn't see those events).
//
// The toast is **latched**: the parent keeps `<PoolToast>` mounted for the
// full `TOAST_MS` window even after the underlying local entry becomes
// `settled` (subgraph reconciled it). Without the latch the toast could
// vanish in well under a second on a fast indexer, giving
// the impression that nothing happened.
const isDepositConfirmedAndUnsettled = (op: LocalEarnOperation) =>
  isLocalEarnDeposit(op) &&
  !op.settled &&
  !!op.initiateTxHash &&
  op.operation.status === DepositStatus.DEPOSIT_TX_CONFIRMED

export const DepositSuccessToast = function () {
  const { localOperations } = useLocalEarnOperations()
  const t = useTranslations('hemi-earn.pool')

  // Snapshot taken on the first render: hashes that were already in the
  // `DEPOSIT_TX_CONFIRMED + !settled` window when this component mounted.
  // Those are reloads or late-mounts of an existing confirmation — the
  // toast was either already shown in a previous session or never deserved
  // to show here, so we skip them. Hashes that transition into the window
  // *after* mount are new confirmations and do toast.
  //
  // Lazy-init via `current === null` so the snapshot reflects the
  // localOperations state at the very first render (a `useEffect` would
  // run too late — `latchOnConfirm` below already fires on that render).
  const seenOnMountRef = useRef<Set<string> | null>(null)
  if (seenOnMountRef.current === null) {
    seenOnMountRef.current = new Set(
      localOperations
        .filter(isDepositConfirmedAndUnsettled)
        .map(op => op.initiateTxHash!.toLowerCase()),
    )
  }

  const confirmed = useMemo(
    function () {
      const candidates = localOperations.filter(isDepositConfirmedAndUnsettled)
      return candidates.sort((a, b) => b.startedAt - a.startedAt)[0]
    },
    [localOperations],
  )

  const [latched, setLatched] = useState<{
    initiateTxHash: Hash
    startedAt: number
  } | null>(null)

  useEffect(
    function latchOnConfirm() {
      if (!confirmed?.initiateTxHash) return
      if (latched?.initiateTxHash === confirmed.initiateTxHash) return
      if (seenOnMountRef.current!.has(confirmed.initiateTxHash.toLowerCase())) {
        return
      }
      setLatched({
        initiateTxHash: confirmed.initiateTxHash,
        startedAt: confirmed.startedAt,
      })
    },
    [confirmed?.initiateTxHash, confirmed?.startedAt, latched?.initiateTxHash],
  )

  const latchedKey = latched?.startedAt
  useEffect(
    function unlatchAfterToastWindow() {
      if (latchedKey === undefined) return undefined
      const timer = setTimeout(() => setLatched(null), TOAST_MS)
      return () => clearTimeout(timer)
    },
    [latchedKey],
  )

  if (!latched) {
    return null
  }

  return (
    <PoolToast
      chainId={hemi.id}
      key={latched.startedAt}
      title={t('deposit-submitted')}
      transactionHash={latched.initiateTxHash}
    />
  )
}
