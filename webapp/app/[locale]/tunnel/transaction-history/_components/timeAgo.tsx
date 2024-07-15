import JsTimeAgo from 'javascript-time-ago'
import enLocale from 'javascript-time-ago/locale/en'
import esLocale from 'javascript-time-ago/locale/es'
import { useEffect, useMemo, useState } from 'react'

const modules = [enLocale, esLocale]
modules.forEach(module => JsTimeAgo.addLocale(module))

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
  const timeAgo = useMemo(() => new JsTimeAgo(locale), [locale])

  // timestamp is unix format
  const date = timestamp * 1000
  const formattedDate = timeAgo.format(date, 'round')

  // force rerender depending on how old the timestamp is
  // for better ux
  useRerender(date)

  return <>{formattedDate}</>
}
