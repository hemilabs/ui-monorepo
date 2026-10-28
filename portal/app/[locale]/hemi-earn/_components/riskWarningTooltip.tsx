import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'use-intl'

export const RiskWarningTooltip = function () {
  const t = useTranslations('hemi-earn')

  return (
    <Tooltip text={t('risk-warning')} variant="info">
      <div className="group/icon flex items-center">
        <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
      </div>
    </Tooltip>
  )
}
