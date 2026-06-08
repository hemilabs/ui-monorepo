'use client'

import { useEffect, useState } from 'react'
import { unixNowTimestamp } from 'utils/time'

// Local-only countdown driven by the on-chain `claimableAt` timestamp
// (read via `useRequestDetails`). Ticks every 60s so the drawer's
// cooldown sub-step copy (and any future table column) updates without
// round-tripping through react-query.
//
// `claimableAt` is the unix-seconds timestamp at which the Vetro Agent
// will allow the claim to fire (set on Ethereum at observation time —
// the authoritative source for cooldown maturity, free of the
// LayerZero-delay drift a local `initiatedAt + duration` calculation
// would carry).
//
// Returns `undefined` while the input is missing, otherwise the
// remaining seconds (clamped at 0).
const TICK_MS = 60_000

const nowInSeconds = () => Number(unixNowTimestamp())

export function useEarnCooldownRemaining({
  claimableAt,
}: {
  claimableAt: bigint | number | undefined
}) {
  const [nowSec, setNowSec] = useState(nowInSeconds)

  const claimableAtSec =
    claimableAt === undefined ? undefined : Number(claimableAt)

  useEffect(
    function tick() {
      if (claimableAtSec === undefined) return undefined
      const id = setInterval(() => setNowSec(nowInSeconds()), TICK_MS)
      return () => clearInterval(id)
    },
    [claimableAtSec],
  )

  if (claimableAtSec === undefined) return undefined
  const remaining = claimableAtSec - nowSec
  return remaining > 0 ? remaining : 0
}
