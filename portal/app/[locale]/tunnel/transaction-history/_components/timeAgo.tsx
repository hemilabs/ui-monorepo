import { useEffect, useState } from 'react'
import { formatPastTime } from 'utils/format'

const second = 1
const minute = second * 60
const hour = minute * 60

const toMs = (seconds: number) => seconds * 1000
const toSeconds = (minutes: number) => minutes * 60
const toMinutes = (hours: number) => hours * 60

const getTimeoutInterval = function (timestamp: number, now: number) {
  const difference = now - timestamp
  // render every second if less than 60 seconds
  if (difference <= toMs(second * 60)) {
    return toMs(second)
  }
  // render every 30 seconds if less than 10 minutes
  if (difference <= toMs(toSeconds(10))) {
    return toMs(toSeconds(minute))
  }
  // render every minute if less than one hour
  if (difference <= toMs(toSeconds(toMinutes(hour)))) {
    return toMs(toSeconds(minute))
  }
  // render once an hour for the rest, we don't care if we force render every hour
  // if the user stares at the screen for one day.
  return toMs(toSeconds(toMinutes(hour)))
}

const useRerender = function (timestamp: number) {
  const [now, setNow] = useState(new Date().getTime())
  useEffect(
    function forceDateUpdate() {
      const timeoutId = setTimeout(
        () => setNow(new Date().getTime()),
        getTimeoutInterval(timestamp, now),
      )
      return () => clearTimeout(timeoutId)
    },
    [now, setNow, timestamp],
  )
}

type Props = {
  locale: string
  timestamp: number
}

export const TimeAgo = function ({ locale, timestamp }: Props) {
  const milliseconds = timestamp * 1000
  // force rerender depending on how old the timestamp is
  useRerender(milliseconds)

  const difference = Math.floor((new Date().getTime() - milliseconds) / 1000)

  return <>{formatPastTime(difference, locale)}</>
}
