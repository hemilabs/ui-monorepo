import { useLocale } from 'next-intl'
import React from 'react'

type Props = {
  lockupDays: number
}

function formatLockupDays({ locale, lockupDays }: Props & { locale: string }) {
  const normalizedDays = Math.max(0, lockupDays)

  let unit: 'day' | 'month' | 'year'
  let value: number

  if (normalizedDays < 31) {
    unit = 'day'
    value = Math.max(0, Math.floor(normalizedDays))
  } else if (normalizedDays < 365) {
    unit = 'month'
    value = Math.max(1, Math.round(normalizedDays / 30))
  } else {
    unit = 'year'
    value = Math.max(1, Math.floor(normalizedDays / 365))
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    style: 'unit',
    unit,
    unitDisplay: 'long',
  }).format(value)
}

export function LockupDisplay({ lockupDays }: Props) {
  const locale = useLocale()

  return <span>{formatLockupDays({ locale, lockupDays })}</span>
}
