'use client'

import { Checkbox } from 'components/checkbox'
import { useTranslations } from 'use-intl'

type Props = {
  acknowledged: boolean
  onChange: (value: boolean) => void
}

export const Acknowledge = function ({ acknowledged, onChange }: Props) {
  const t = useTranslations('token-custom-drawer')
  return (
    <label
      className="flex cursor-pointer items-center gap-x-2"
      htmlFor="custom-token-acknowledged"
    >
      <Checkbox
        checked={acknowledged}
        id="custom-token-acknowledged"
        onChange={onChange}
      />
      <span className="text-sm font-medium text-neutral-500">
        {t('i-am-sure-to-tunnel')}
      </span>
    </label>
  )
}
