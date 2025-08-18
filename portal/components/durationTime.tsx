'use client'

import { shouldPolyfill } from '@formatjs/intl-durationformat/should-polyfill'
import { useQuery } from '@tanstack/react-query'
import { useUmami } from 'hooks/useUmami'
import { useLocale } from 'next-intl'
import Skeleton from 'react-loading-skeleton'

type DurationTimeProps = {
  seconds: number
}

// While this function could be on its own file, and not be a component,
// I prefer to keep it here encapsulated because it uses Intl.DurationFormat,
// which needs to be dynamically polyfilled.
// Having the function separated could cause scenarios where it is called
// without the polyfill when needed.
const formatDuration = function (durationSeconds: number, locale: string) {
  // Thresholds in descending order - we want the biggest unit available
  const thresholds = [
    { seconds: 28944000, unit: 'years' as const }, // 11 months, assuming 365 days - 30 days
    { seconds: 2419200, unit: 'months' as const }, // 4 weeks
    { seconds: 518400, unit: 'weeks' as const }, // 4 days
    { seconds: 82800, unit: 'days' as const }, // 23 hours
    { seconds: 3540, unit: 'hours' as const }, // 59 minutes
    { seconds: 59, unit: 'minutes' as const }, // 59 seconds
    { seconds: 1, unit: 'seconds' as const }, // 1 second
  ]

  // Find the biggest unit that fits
  for (const { seconds: thresholdSeconds, unit } of thresholds) {
    if (durationSeconds >= thresholdSeconds) {
      const value = Math.floor(durationSeconds / thresholdSeconds)

      // Create duration object with only the relevant unit
      const duration = { [unit]: value }

      return new Intl.DurationFormat(locale, {
        style: 'long',
      }).format(duration)
    }
  }

  // Fallback for very small durations
  return new Intl.DurationFormat(locale, {
    style: 'long',
  }).format({ seconds: 0 })
}

export const DurationTime = function ({ seconds }: DurationTimeProps) {
  const locale = useLocale()
  const { track } = useUmami()

  const needsPolyfill = shouldPolyfill()

  // Dynamically load the polyfill if needed
  const { data: polyfillLoaded } = useQuery({
    enabled: needsPolyfill,
    initialData: needsPolyfill ? undefined : true,
    queryFn: () =>
      // See https://formatjs.github.io/docs/polyfills/intl-durationformat/
      // react-query expects something (not undefined) to be returned.
      import('@formatjs/intl-durationformat/polyfill-force')
        // let's track how many users needed polyfilling, to understand
        // if it was a viable decision or not
        .then(() => track?.('staking dashboard - polyfill DurationFormat'))
        .then(() => true),
    queryKey: ['duration-polyfill', needsPolyfill],
    // once loaded, no need to revalidate
    staleTime: Infinity,
  })

  if (!polyfillLoaded) {
    // if here, polyfill is loading
    return <Skeleton className="h-4.5 w-22" />
  }

  const formattedDuration = formatDuration(seconds, locale)

  return formattedDuration
}
