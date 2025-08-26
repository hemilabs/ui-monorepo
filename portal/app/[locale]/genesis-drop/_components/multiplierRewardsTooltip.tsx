import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'

import { useHemiToken } from '../_hooks/useHemiToken'

type Props = {
  multiplier?: number
}

export const MultiplierRewardsTooltip = function ({ multiplier }: Props) {
  const t = useTranslations('genesis-drop.claim-options')
  const { symbol } = useHemiToken()
  return (
    <Tooltip
      borderRadius="12px"
      id="staked-hemi"
      overlay={
        multiplier && (
          <p className="p-4 text-sm font-medium text-white">
            {t('staked-tokens-may-qualify', {
              multiplier,
              symbol,
            })}
          </p>
        )
      }
    >
      <div className="group/icon">
        <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
      </div>
    </Tooltip>
  )
}
