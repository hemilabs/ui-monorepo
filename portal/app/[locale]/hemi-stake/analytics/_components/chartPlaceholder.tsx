import { Button } from 'components/button'
import Skeleton from 'react-loading-skeleton'
import { useTranslations } from 'use-intl'
import { VictoryAxis, VictoryChart } from 'victory'

import {
  chartHeight,
  chartPadding,
  epochAxisStyle,
  xAxisStyle,
  yAxisStyle,
} from '../_utils/chartLayout'

const skeletonBarHeights = [46, 62, 54, 70, 58, 74, 64, 80, 68, 86, 76, 92]

type Props = {
  chartWidth: number
  isPending: boolean
  onRetry: VoidFunction
  padding?: typeof chartPadding
  xAxisLabel?: string
  xTickFormat: (tick: number) => string
  xTicks: number[]
}

export const ChartPlaceholder = function ({
  chartWidth,
  isPending,
  onRetry,
  padding = chartPadding,
  xAxisLabel,
  xTickFormat,
  xTicks,
}: Props) {
  const tCommon = useTranslations('common')

  const emptyChart = (
    <VictoryChart height={chartHeight} padding={padding} width={chartWidth}>
      <VictoryAxis
        label={xAxisLabel}
        style={xAxisLabel === undefined ? xAxisStyle : epochAxisStyle}
        tickFormat={xTickFormat}
        tickValues={xTicks}
      />
      <VictoryAxis dependentAxis style={yAxisStyle} tickFormat={() => ''} />
    </VictoryChart>
  )

  const plotArea = {
    bottom: `${(padding.bottom / chartHeight) * 100}%`,
    left: `${(padding.left / chartWidth) * 100}%`,
    right: `${(padding.right / chartWidth) * 100}%`,
    top: `${(padding.top / chartHeight) * 100}%`,
  }

  if (isPending) {
    return (
      <div className="relative">
        {emptyChart}
        <div className="absolute flex items-end gap-[2%]" style={plotArea}>
          {skeletonBarHeights.map(height => (
            <div
              className="flex-1"
              key={height}
              style={{ height: `${height}%` }}
            >
              <Skeleton height="100%" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="opacity-30">{emptyChart}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Button
          onClick={onRetry}
          size="xSmall"
          type="button"
          variant="secondary"
        >
          {tCommon('try-again')}
        </Button>
      </div>
    </div>
  )
}
