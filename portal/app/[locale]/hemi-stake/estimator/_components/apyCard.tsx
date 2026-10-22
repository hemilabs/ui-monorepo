import { Badge } from 'components/badge'
import { ArrowGrowingIcon } from 'components/icons/arrowGrowingIcon'
import { InfoIcon } from 'components/icons/infoIcon'
import { StatBadgeSkeleton } from 'components/statBadgeSkeleton'
import { StatCard } from 'components/statCard'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'use-intl'

import { formatApyFromRatio } from '../../_utils/formatApyFromRatio'

type Props = {
  isError: boolean
  isLoading: boolean
  stakedReturnRatio?: number
  yearOneReturnRatio: number
}

export const ApyCard = function ({
  isError,
  isLoading,
  stakedReturnRatio,
  yearOneReturnRatio,
}: Props) {
  const t = useTranslations('hemi-stake')
  const tCommon = useTranslations('common')

  return (
    <StatCard
      badge={
        isLoading ? (
          <StatBadgeSkeleton size="xSmall" />
        ) : (
          <Badge size="small" variant="secondary">
            {stakedReturnRatio === undefined
              ? t('estimator.simple-first-year')
              : t('estimator.blended-was', {
                  percentage: formatApyFromRatio(stakedReturnRatio),
                })}
          </Badge>
        )
      }
      icon={<ArrowGrowingIcon />}
      isError={isError}
      isLoading={isLoading}
      label={
        <span className="flex items-center gap-x-1">
          {tCommon('apy')}
          <Tooltip id="estimator-apy" text={t('apy-estimate')} variant="info">
            <div className="group/icon flex items-center">
              <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
            </div>
          </Tooltip>
        </span>
      }
      value={formatApyFromRatio(yearOneReturnRatio)}
    />
  )
}
