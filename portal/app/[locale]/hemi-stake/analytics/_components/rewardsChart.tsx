import { useLocale, useTranslations } from 'use-intl'
import { formatDate } from 'utils/format'
import { SixDaysSeconds } from 've-hemi-actions'
import {
  type CallbackArgs,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryStack,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'

import { useChartWidth } from '../_hooks/useChartWidth'
import {
  chartHeight,
  epochAxisStyle,
  getHalfSlot,
  rewardsChartPadding,
  yAxisStyle,
} from '../_utils/chartLayout'
import { formatSupplyValue } from '../_utils/formatSupplyValue'
import { type RewardsBar, type RewardsSeries } from '../_utils/rewardsHistory'

import { ChartPlaceholder } from './chartPlaceholder'
import { ChartTooltipLabel, getTooltipHeight } from './chartTooltipLabel'

const tooltipWidth = 216
const openEpochOpacity = 0.4
const maxXTicks = 8

const isShown = ({ projected, y }: RewardsBar) => !projected || y > 0

const countShownSeries = (series: RewardsSeries[], x: number) =>
  series.filter(({ points }) =>
    points.some(point => point.x === x && isShown(point)),
  ).length

type ActivePoint = RewardsBar & { childName?: string }

type TooltipProps = {
  activePoints?: ActivePoint[]
  formatNote: (point: RewardsBar) => string | undefined
  formatTitle: (point: RewardsBar) => string
  formatValue: (value: number) => string
  protocolFeesLabel: string
  series: RewardsSeries[]
  totalLabel: string
  x?: number
  y?: number
}

const RewardsTooltipLabel = function ({
  activePoints,
  formatNote,
  formatTitle,
  formatValue,
  protocolFeesLabel,
  series,
  totalLabel,
  x = 0,
  y = 0,
}: TooltipProps) {
  if (!activePoints?.length) {
    return null
  }

  const note = formatNote(activePoints[0])
  const lines = series
    .map(function ({ color, symbol }) {
      const point = activePoints.find(active => active.childName === symbol)
      return point === undefined || !isShown(point)
        ? undefined
        : {
            color,
            dashed: point.projected,
            label: symbol,
            value: formatValue(point.y),
          }
    })
    .filter(line => line !== undefined)
  const total = activePoints.reduce((sum, point) => sum + point.y, 0)

  return (
    <ChartTooltipLabel
      lines={
        activePoints[0].projected
          ? [...lines, { label: protocolFeesLabel }]
          : lines
      }
      note={note}
      title={formatTitle(activePoints[0])}
      total={formatValue(total)}
      totalLabel={totalLabel}
      width={tooltipWidth}
      x={x}
      y={y}
    />
  )
}

type Props = {
  isPending: boolean
  onRetry: VoidFunction
  series: RewardsSeries[] | undefined
}

export const RewardsChart = function ({ isPending, onRetry, series }: Props) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.analytics')
  const chartWidth = useChartWidth()

  const formatValue = (value: number) =>
    formatSupplyValue({ locale, symbol: '', unit: 'usd', value })

  const formatTooltipValue = (value: number) =>
    formatSupplyValue({
      locale,
      precision: 'full',
      symbol: '',
      unit: 'usd',
      value,
    })

  const formatDay = (day: string) =>
    formatDate(new Date(`${day}T00:00:00Z`), locale, 'UTC')

  const formatTooltipTitle = ({
    preHemiStake,
    timestamp,
    x: epoch,
  }: RewardsBar) =>
    preHemiStake
      ? `${t('epoch', { epoch: String(preHemiStake.fundedEpoch) })} · ${formatDay(preHemiStake.from)} – ${formatDay(preHemiStake.to)}`
      : `${t('epoch', { epoch: String(epoch) })} · ${formatDate(new Date(epoch * SixDaysSeconds * 1000), locale, 'UTC')} – ${formatDate(new Date(timestamp), locale, 'UTC')}`

  const formatTooltipNote = function ({
    preHemiStake,
    projected,
    settled,
  }: RewardsBar) {
    if (projected) {
      return t('projected')
    }
    if (preHemiStake) {
      return t('pre-hemi-stake')
    }
    return settled ? undefined : t('in-progress')
  }

  const epochs = series?.[0]?.points.map(({ x }) => x) ?? []
  const barCount = epochs.length
  const xTickStep = Math.ceil(barCount / maxXTicks)
  const xTicks = epochs.filter((_, index) => index % xTickStep === 0)
  const preHemiStakeEpochs = new Set(
    (series?.[0]?.points ?? [])
      .filter(({ preHemiStake }) => preHemiStake !== undefined)
      .map(({ x }) => x),
  )

  const formatXTick = (tick: number) =>
    preHemiStakeEpochs.has(tick) ? '' : String(tick)

  const projectedColor = series?.find(({ points }) =>
    points.some(({ projected, y }) => projected && y > 0),
  )?.color

  if (series !== undefined && series.length > 0) {
    return (
      <>
        <VictoryChart
          containerComponent={
            <VictoryVoronoiContainer
              labelComponent={
                <VictoryTooltip
                  constrainToVisibleArea
                  cornerRadius={8}
                  flyoutHeight={({ datum }: CallbackArgs) =>
                    getTooltipHeight({
                      hasNote: formatTooltipNote(datum) !== undefined,
                      lineCount:
                        countShownSeries(series, datum.x) +
                        (datum.projected ? 1 : 0),
                    })
                  }
                  flyoutStyle={{ fill: 'white', stroke: '#E5E5E5' }}
                  flyoutWidth={tooltipWidth}
                  labelComponent={
                    <RewardsTooltipLabel
                      formatNote={formatTooltipNote}
                      formatTitle={formatTooltipTitle}
                      formatValue={formatTooltipValue}
                      protocolFeesLabel={t('protocol-fees')}
                      series={series}
                      totalLabel={t('total')}
                    />
                  }
                  pointerLength={0}
                />
              }
              labels={() => ' '}
              voronoiDimension="x"
            />
          }
          domainPadding={{ x: getHalfSlot({ barCount, chartWidth }) }}
          height={chartHeight}
          padding={rewardsChartPadding}
          width={chartWidth}
        >
          <VictoryAxis
            label={t('epochs')}
            style={epochAxisStyle}
            tickFormat={formatXTick}
            tickValues={xTicks}
          />
          <VictoryAxis
            dependentAxis
            style={yAxisStyle}
            tickFormat={formatValue}
          />
          <VictoryStack>
            {series.map(({ color, points, symbol }) => (
              <VictoryBar
                barRatio={0.9}
                data={points}
                key={symbol}
                name={symbol}
                style={{
                  data: {
                    fill: ({ datum }) =>
                      datum.projected ? 'transparent' : color,
                    fillOpacity: ({ datum }) =>
                      datum.settled ? 1 : openEpochOpacity,
                    stroke: ({ datum }) =>
                      datum.projected && datum.y > 0 ? color : 'none',
                    strokeDasharray: '3,2',
                    strokeWidth: 1,
                  },
                }}
              />
            ))}
          </VictoryStack>
        </VictoryChart>
        <div className="body-text-caption mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500">
          {series.map(({ color, symbol }) => (
            <span className="flex items-center gap-1.5" key={symbol}>
              <span
                className="size-2 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {symbol}
            </span>
          ))}
          {projectedColor !== undefined && (
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-sm border border-dashed"
                style={{ borderColor: projectedColor }}
              />
              {t('projected')}
            </span>
          )}
        </div>
      </>
    )
  }

  return (
    <ChartPlaceholder
      chartWidth={chartWidth}
      isPending={isPending}
      onRetry={onRetry}
      padding={rewardsChartPadding}
      xAxisLabel={t('epochs')}
      xTickFormat={() => ''}
      xTicks={[]}
    />
  )
}
