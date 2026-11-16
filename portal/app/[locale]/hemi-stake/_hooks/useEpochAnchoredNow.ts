import { useState } from 'react'
import { unixNowTimestamp } from 'utils/time'

export const useEpochAnchoredNow = function (epoch: number | undefined) {
  const [anchor, setAnchor] = useState(() => ({
    epoch,
    now: Number(unixNowTimestamp()),
  }))

  if (epoch !== undefined && epoch !== anchor.epoch) {
    setAnchor({ epoch, now: Number(unixNowTimestamp()) })
  }

  return anchor.now
}
