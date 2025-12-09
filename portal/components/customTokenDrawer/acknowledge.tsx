'use client'

import { useTranslations } from 'next-intl'

type Props = {
  acknowledged: boolean
  onChange: (value: boolean) => void
}

export const Acknowledge = function ({ acknowledged, onChange }: Props) {
  const t = useTranslations('token-custom-drawer')
  return (
    <label
      className="relative flex cursor-pointer items-center gap-x-2"
      htmlFor="custom-token-acknowledged"
    >
      <input
        checked={acknowledged}
        className="checkbox h-4 w-4 cursor-pointer appearance-none rounded bg-white shadow-sm
              transition-all checked:bg-orange-600 focus:ring-2 focus:ring-orange-600"
        id="custom-token-acknowledged"
        onChange={e => onChange(e.target.checked)}
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
        {t('i-am-sure-to-tunnel')}
      </span>
    </label>
  )
}
