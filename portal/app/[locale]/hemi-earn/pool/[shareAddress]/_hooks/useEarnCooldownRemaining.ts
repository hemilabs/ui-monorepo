'use client'

import { useEffect, useState } from 'react'
import { unixNowTimestamp } from 'utils/time'

// Local-only countdown driven by `claimableAt` from the Envio subgraph.
// Ticks every 60s so the drawer's cooldown sub-step copy (and any future
// table column) updates without round-tripping through react-query.
//
// `claimableAt` is the unix-seconds timestamp at which the Vetro Agent
// will allow the claim to fire (set on Ethereum at observation time —
// the authoritative source for cooldown maturity, free of the
// LayerZero-delay drift a local `requestedAt + duration` calculation
// would carry).
//
// Returns `undefined` while the input is missing, otherwise the
// remaining seconds (clamped at 0).
const TICK_MS = 60_000

const nowInSeconds = () => Number(unixNowTimestamp())

export function computeCooldownRemaining(
  claimableAt: bigint | number | undefined,
  nowSec: number,
) {
  if (claimableAt === undefined) return undefined
  const remaining = Number(claimableAt) - nowSec
  return remaining > 0 ? remaining : 0
}

export function useEarnCooldownRemaining(
  claimableAt: bigint | number | undefined,
) {
  const [nowSec, setNowSec] = useState(nowInSeconds)

  useEffect(
    function tick() {
      if (claimableAt === undefined) return undefined
      const id = setInterval(() => setNowSec(nowInSeconds()), TICK_MS)
      return () => clearInterval(id)
    },
    [claimableAt],
  )

  return computeCooldownRemaining(claimableAt, nowSec)
}
