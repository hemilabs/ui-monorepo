'use client'

import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction } from 'react'

type Props = {
  acknowledged: boolean
  setAcknowledged: Dispatch<SetStateAction<boolean>>
}

export const Acknowledge = function ({ acknowledged, setAcknowledged }: Props) {
  const t = useTranslations('bitcoin-yield.drawer')
  return (
    <label
      className="relative flex cursor-pointer items-start gap-x-2"
      htmlFor="acknowledge-beta-site"
    >
      <input
        checked={acknowledged}
        className="checkbox mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded
            bg-white shadow-sm transition-all checked:bg-orange-600 focus:ring-2 focus:ring-orange-600"
        id="acknowledge-beta-site"
        onChange={e => setAcknowledged(e.target.checked)}
        type="checkbox"
      />
      {acknowledged && (
        <div className="pointer-events-none absolute left-0.5 top-1">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 12 12"
          >
            <path
              d="M2 6.5l2.5 2.5L10 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <span className="text-sm font-medium text-neutral-500">
        {t('ack-beta-site')}
      </span>
    </label>
  )
}
