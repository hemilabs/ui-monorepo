import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'

import { formatApyDisplay } from '../_utils'

type Props = {
  apy: { base: number; incentivized: number; total: number }
}

export const ApyWithTooltip = function ({ apy }: Props) {
  const t = useTranslations('hemi-earn.table')

  const tooltipContent = (
    <span className="flex w-44 flex-col">
      <span className="flex items-center justify-between">
        <span>{t('apy-base')}</span>
        <span>{formatApyDisplay(apy.base)}</span>
      </span>
      <span className="flex items-center justify-between">
        <span>{t('apy-incentivized')}</span>
        <span>{formatApyDisplay(apy.incentivized)}</span>
      </span>
    </span>
  )

  return (
    <div className="flex items-center gap-x-1">
      <span className="text-orange-600">{formatApyDisplay(apy.total)}</span>
      <Tooltip text={tooltipContent} variant="simple">
        <div className="group">
          <InfoIcon className="size-4 [&_path]:fill-neutral-400 [&_path]:transition-colors [&_path]:duration-300 group-hover:[&_path]:fill-neutral-950" />
        </div>
      </Tooltip>
    </div>
  )
}
