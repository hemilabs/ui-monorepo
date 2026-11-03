import { hemi } from 'hemi-viem'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'use-intl'
import { type Address, type Hash } from 'viem'
import { useAccount } from 'wagmi'

import { useEarnTransactionsQuery } from '../_hooks/useEarnTransactionsQuery'
import { useEarnVaults } from '../_hooks/useEarnVaults'
import { completedCopy } from '../_utils/successCopy'
import { findVaultByAsset, findVaultMetadata } from '../_utils/vaults'
import { type EarnTransactionKindType } from '../types'
import { VaultToast } from '../vault/[shareAddress]/_components/vaultToast'

// Match the <Toast> primitive's 10s auto-close so its close animation isn't cut short.
const toastMs = 10_000

type Props = {
  kind: EarnTransactionKindType
  title: string
}

// Toasts when a request reaches FINALIZED (cross-chain complete). Snapshots the
// already-finalized hashes on first render so a session with historical rows doesn't fire a burst.
export const EarnSuccessToast = function ({ kind, title }: Props) {
  const { address } = useAccount()
  const { data } = useEarnTransactionsQuery()
  const { data: vaults, isPending: areVaultsPending } = useEarnVaults()
  const t = useTranslations('hemi-earn.vault')

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
    asset: Address
    claimTxHash: Hash
    requestTxHash: Hash
  } | null>(null)

  useEffect(
    function latchOnNewClaim() {
      if (!newClaim?.claimTxHash || areVaultsPending) return
      const hash = newClaim.requestTxHash.toLowerCase()
      if (shownRef.current.has(hash)) return
      shownRef.current.add(hash)
      setLatched({
        asset: newClaim.asset,
        claimTxHash: newClaim.claimTxHash,
        requestTxHash: newClaim.requestTxHash,
      })
    },
    [
      areVaultsPending,
      newClaim?.asset,
      newClaim?.claimTxHash,
      newClaim?.requestTxHash,
    ],
  )

  const latchedKey = latched?.requestTxHash
  useEffect(
    function unlatchAfterToastWindow() {
      if (latchedKey === undefined) return undefined
      const timer = setTimeout(() => setLatched(null), toastMs)
      return () => clearTimeout(timer)
    },
    [latchedKey],
  )

  if (!latched) return null

  const vault = vaults && findVaultByAsset(vaults, latched.asset)

  return (
    <VaultToast
      chainId={hemi.id}
      description={completedCopy({
        kind,
        operator: vault && findVaultMetadata(vault.stakingVault)?.operator,
        t,
        vaultName: vault?.shareToken.symbol,
      })}
      key={latched.requestTxHash}
      title={title}
      transactionHash={latched.claimTxHash}
    />
  )
}
