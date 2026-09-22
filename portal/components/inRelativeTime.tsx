import { useEffect, useState } from 'react'
import { useLocale } from 'use-intl'
import { formatFutureTime, formatPastTime } from 'utils/format'
import { getTimeoutInterval } from 'utils/relativeTimeRefresh'

const useRerender = function (targetTimestamp: number) {
  const [now, setNow] = useState(new Date().getTime())
  useEffect(
    function forceDateUpdate() {
      const timeoutId = setTimeout(
        () => setNow(new Date().getTime()),
        getTimeoutInterval(targetTimestamp, new Date().getTime()),
      )
      return () => clearTimeout(timeoutId)
    },
    [now, setNow, targetTimestamp],
  )
}

type Props = {
  timestamp: number
}

export const InRelativeTime = function ({ timestamp }: Props) {
  const locale = useLocale()
  const milliseconds = timestamp * 1000
  const now = new Date().getTime()

  // force rerender depending on how close the target timestamp is
  useRerender(milliseconds)

  const difference = Math.floor(Math.abs(now - milliseconds) / 1000)
  const isPast = milliseconds <= now

  // if time difference equals 0, Intl.RelativeTimeFormat returns "now"
  return (
    <>
      {isPast
        ? formatPastTime(difference, locale)
        : formatFutureTime(difference, locale)}
    </>
  )
}
