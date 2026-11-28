import { useMemo } from 'react'
import { useLocale } from 'use-intl'
import { createFormatter } from 'utils/format'

export const useFormat = function () {
  const locale = useLocale()
  return useMemo(() => createFormatter(locale), [locale])
}
