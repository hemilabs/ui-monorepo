'use client'

import { useEffect, useState } from 'react'
import { unixNowTimestamp } from 'utils/time'

// Local countdown from the subgraph's claimableAt (unix seconds, set on Ethereum — authoritative
// for maturity, free of the LayerZero drift a local requestedAt + duration would carry). Ticks
// every 60s; returns undefined until the input exists.
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
