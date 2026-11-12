import { useEffect, useState } from 'react'
import { unixNowTimestamp } from 'utils/time'

import { computeCooldownRemaining } from '../../../_utils/cooldown'

// Local countdown from the subgraph's claimableAt (unix seconds, set on Ethereum — authoritative
// for maturity, free of the LayerZero drift a local requestedAt + duration would carry). Ticks
// every 60s; returns undefined until the input exists.
const tickMs = 60_000

const nowInSeconds = () => Number(unixNowTimestamp())

export function useEarnCooldownRemaining(
  claimableAt: bigint | number | undefined,
) {
  const [nowSec, setNowSec] = useState(nowInSeconds)

  useEffect(
    function tick() {
      if (claimableAt === undefined) return undefined
      const id = setInterval(() => setNowSec(nowInSeconds()), tickMs)
      return () => clearInterval(id)
    },
    [claimableAt],
  )

  return computeCooldownRemaining(claimableAt, nowSec)
}
