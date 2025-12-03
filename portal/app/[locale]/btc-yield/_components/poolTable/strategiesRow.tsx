import { useTranslations } from 'next-intl'

import { usePoolAsset } from '../../_hooks/usePoolAsset'
import type { Strategy } from '../../_types'
import { formatStrategyName, formatStrategyWeight } from '../../_utils'

import { StrategyIcon } from './strategyIcon'

type Props = {
  strategies: Strategy[]
}
export const StrategiesRow = function ({ strategies }: Props) {
  const poolAsset = usePoolAsset().data
  const t = useTranslations('bitcoin-yield')
  return (
    <div className="mb-1.5 w-full px-4">
      <div className="flex items-center gap-x-6 rounded bg-neutral-50 p-4">
        <span className="body-text-semibold self-start text-neutral-600">
          {t('pool-strategy')}
        </span>
        <div className="flex w-full flex-col gap-y-3">
          {strategies.map(strategy => (
            <div
              className="body-text-medium flex items-center gap-x-2"
              key={strategy.address}
            >
              <StrategyIcon strategy={strategy} />
              <span className="mr-2 text-neutral-950">
                {formatStrategyName(strategy.name, poolAsset.symbol)}
              </span>
              <div className="h-px w-full bg-neutral-300/55" />
              <span className="ml-2">
                {formatStrategyWeight(strategy.weight)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
