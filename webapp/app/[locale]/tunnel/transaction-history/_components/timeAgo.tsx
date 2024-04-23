import JsTimeAgo from 'javascript-time-ago'
import enLocale from 'javascript-time-ago/locale/en'
import esLocale from 'javascript-time-ago/locale/es'

const modules = [enLocale, esLocale]
modules.forEach(module => JsTimeAgo.addLocale(module))

export const TimeAgo = function ({
  locale,
  timestamp,
}: {
  locale: string
  timestamp: bigint
}) {
  const timeAgo = new JsTimeAgo(locale)
  // timestamp is unix format
  return timeAgo.format(Number(timestamp) * 1000)
}
