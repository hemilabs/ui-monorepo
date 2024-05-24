import JsTimeAgo from 'javascript-time-ago'
import enLocale from 'javascript-time-ago/locale/en'
import esLocale from 'javascript-time-ago/locale/es'

const modules = [enLocale, esLocale]
modules.forEach(module => JsTimeAgo.addLocale(module))

type Props = {
  locale: string
  timestamp: number
}

export const TimeAgo = function ({ locale, timestamp }: Props) {
  const timeAgo = new JsTimeAgo(locale)
  // timestamp is unix format
  return timeAgo.format(timestamp * 1000)
}
