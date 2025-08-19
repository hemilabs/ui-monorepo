import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { formatFutureTime, formatPastTime } from 'utils/format'

const second = 1
const minute = second * 60
const hour = minute * 60

const toMs = (seconds: number) => seconds * 1000
const toSeconds = (minutes: number) => minutes * 60
const toMinutes = (hours: number) => hours * 60

const getTimeoutInterval = function (targetTimestamp: number, now: number) {
  const difference = Math.abs(now - targetTimestamp)
  // render every second if less than 60 seconds
  if (difference <= toMs(second * 60)) {
    return toMs(second)
  }
  // render every 30 seconds if less than 10 minutes
  if (difference <= toMs(toSeconds(10))) {
    return toMs(30 * second)
  }
  // render every minute if less than one hour
  if (difference <= toMs(toSeconds(toMinutes(hour)))) {
    return toMs(toSeconds(minute))
  }
  // render once an hour for the rest
  return toMs(toSeconds(toMinutes(hour)))
}

const useRerender = function (targetTimestamp: number) {
  const [now, setNow] = useState(new Date().getTime())
  useEffect(
    function forceDateUpdate() {
      const timeoutId = setTimeout(
        () => setNow(new Date().getTime()),
        getTimeoutInterval(targetTimestamp, now),
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
