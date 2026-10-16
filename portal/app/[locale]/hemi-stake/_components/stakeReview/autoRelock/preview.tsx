import { Button } from 'components/button'
import { DisplayAmount } from 'components/displayAmount'
import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useLocale, useTranslations } from 'use-intl'
import {
  formatNumber,
  formatShortDate,
  formatShortDateWithYear,
} from 'utils/format'
import { unixNowTimestamp } from 'utils/time'
import { snapToEpoch } from 've-hemi-actions'
import { formatUnits } from 'viem'

import { useAutoRelockInputs } from '../../../_hooks/useAutoRelockInputs'
import { getAutoRelockComparison } from '../../../_utils/autoRelockComparison'
import { formatApyFromRatio } from '../../../_utils/formatApyFromRatio'
import { formatPayoutValue } from '../../../_utils/formatPayoutValue'
import {
  getUnlockInfo,
  predictVotingPower,
} from '../../../_utils/lockCreationTimes'
import { getWeightAt } from '../../../_utils/lockEpochs'
import { getPayoutAxisTicks } from '../../../_utils/payoutsChartData'
import {
  alwaysTransferable,
  emptyInputsByClass,
} from '../../../_utils/rewardClass'
import { PayoutsChart } from '../../estimatedPayouts/payoutsChart'
import { VotingPowerEquivalence } from '../../lockup'

const cardClassName =
  'flex w-full flex-col gap-y-3 rounded-lg bg-neutral-50 p-4'
const sectionLabelClassName =
  'text-xxs font-medium uppercase tracking-widest text-neutral-500'

const Arrow = () => <span className="text-neutral-400">&rarr;</span>

const ChangeRow = ({
  from,
  label,
  to,
}: {
  from: ReactNode
  label: string
  to: ReactNode
}) => (
  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
    <span className="text-neutral-500">{label}</span>
    <div className="flex items-center gap-x-2 text-neutral-950">
      <span className="text-neutral-500">{from}</span>
      <Arrow />
      <span className="font-medium">{to}</span>
    </div>
  </div>
)

const LegendItem = ({
  label,
  swatchClassName,
}: {
  label: string
  swatchClassName: string
}) => (
  <div className="flex items-center gap-x-1.5">
    <span className={`size-2 rounded-sm ${swatchClassName}`} />
    <span className="text-xxs text-neutral-500">{label}</span>
  </div>
)

const PayoutsFallback = function ({
  hasError,
  isPending,
  onRetry,
}: {
  hasError: boolean
  isPending: boolean
  onRetry: VoidFunction
}) {
  const t = useTranslations('hemi-stake.estimated-payouts')
  const tCommon = useTranslations('common')

  if (hasError) {
    return (
      <div className="flex flex-col items-start gap-y-2">
        <span className="text-xs text-neutral-400">{t('load-failed')}</span>
        <Button
          onClick={onRetry}
          size="xSmall"
          type="button"
          variant="secondary"
        >
          {tCommon('try-again')}
        </Button>
      </div>
    )
  }

  if (isPending) {
    return <Skeleton className="h-6 w-40" />
  }

  return <span className="text-xs text-neutral-400">{t('not-funded')}</span>
}

type Props = {
  autoRelock: boolean
  isRunningOperation: boolean
  lockTime: bigint
  onSubmit: VoidFunction
  stakedAmount: bigint
  submitLabel: string
  timestamp: bigint
  tokenId: bigint
  transferable: boolean | undefined
}

export const Preview = function ({
  autoRelock,
  isRunningOperation,
  lockTime,
  onSubmit,
  stakedAmount,
  submitLabel,
  timestamp,
  tokenId,
  transferable,
}: Props) {
  const hemi = useHemi()
  const locale = useLocale()
  const t = useTranslations('hemi-stake')
  const tDrawer = useTranslations('hemi-stake.drawer.auto-relock')
  const token = useHemiToken()
  const { hasError, inputsByClass, positionClass, retry } = useAutoRelockInputs(
    { tokenId, transferable },
  )

  const now = Number(unixNowTimestamp())
  const { timeRemainingSeconds, unlockDate, unlockTime } = getUnlockInfo({
    lockTime,
    timestamp,
  })

  const { base, current, delta, next } = getAutoRelockComparison({
    amount: stakedAmount,
    autoRelock,
    decimals: token.decimals,
    inputsByClass: inputsByClass ?? emptyInputsByClass,
    lockDurationInSeconds: timeRemainingSeconds,
    now,
    positionClass: positionClass ?? alwaysTransferable,
    unlockTime,
  })

  const hasData = inputsByClass !== undefined && positionClass !== undefined
  const hasForecast =
    hasData &&
    (current.yearOneTotal > BigInt(0) || next.yearOneTotal > BigInt(0))

  const votingPower = formatUnits(
    predictVotingPower({ amount: stakedAmount, lockTime, timestamp }),
    token.decimals,
  )
  const decaysCaption = tDrawer('decays-to-zero', {
    date: formatShortDateWithYear(unlockDate, locale),
  })
  const frozenVotingPower = formatUnits(
    getWeightAt({
      amount: stakedAmount,
      at: snapToEpoch(now),
      lockEnd: unlockTime,
    }),
    token.decimals,
  )
  const staysCaption = tDrawer('stays-at', {
    votingPower: formatNumber(frozenVotingPower),
  })

  const [votingPowerFrom, votingPowerTo] = autoRelock
    ? [staysCaption, decaysCaption]
    : [decaysCaption, staysCaption]
  const [legendBase, legendDelta] = autoRelock
    ? [tDrawer('legend-after-disabling'), tDrawer('legend-today')]
    : [tDrawer('legend-today'), tDrawer('legend-with-auto-relock')]

  const toApy = (ratio: number) =>
    hasForecast ? formatApyFromRatio(ratio) : '-'

  const toTotal = (amount: bigint) => (
    <DisplayAmount amount={formatUnits(amount, token.decimals)} token={token} />
  )

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={function (e) {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="flex flex-1 flex-col gap-y-3 overflow-y-auto p-4 md:p-6">
        <div className={cardClassName}>
          <ChangeRow
            from={toApy(current.yearOneReturnRatio)}
            label={tDrawer('apy')}
            to={toApy(next.yearOneReturnRatio)}
          />
          <div className="h-px w-full bg-neutral-300/55" />
          <div className="flex flex-col gap-y-1">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
              <span className="text-neutral-500">{t('voting-power')}</span>
              <span className="text-neutral-950">
                <VotingPowerEquivalence
                  amount={formatUnits(stakedAmount, token.decimals)}
                  token={token}
                  votingPower={votingPower}
                />
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xxs text-neutral-400">
              <span>{votingPowerFrom}</span>
              <Arrow />
              <span className="font-medium text-neutral-600">
                {votingPowerTo}
              </span>
            </div>
          </div>
        </div>
        <div className={cardClassName}>
          <span className={sectionLabelClassName}>
            {t('estimated-payouts.title')}
          </span>
          {hasForecast ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm text-neutral-500">
                  {toTotal(current.yearOneTotal)}
                </span>
                <Arrow />
                <span className="text-mid-md font-semibold text-neutral-950">
                  {toTotal(next.yearOneTotal)}
                </span>
                <span className="text-sm text-neutral-500">
                  {t('estimated-payouts.first-year')}
                </span>
              </div>
              <PayoutsChart
                deltaSeries={delta}
                formatDate={value => formatShortDate(new Date(value), locale)}
                formatDetail={point =>
                  formatPayoutValue({ symbol: token.symbol, value: point.y })
                }
                formatTooltipDate={value =>
                  formatShortDateWithYear(new Date(value), locale)
                }
                formatValue={value =>
                  formatPayoutValue({ symbol: token.symbol, value })
                }
                isPending={false}
                series={base}
                ticks={getPayoutAxisTicks(base)}
                unlockX={undefined}
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <LegendItem
                  label={legendBase}
                  swatchClassName="bg-orange-500"
                />
                <LegendItem
                  label={legendDelta}
                  swatchClassName="bg-orange-200"
                />
              </div>
            </>
          ) : (
            <PayoutsFallback
              hasError={hasError}
              isPending={!hasData && !hasError}
              onRetry={retry}
            />
          )}
        </div>
      </div>
      <CallToActionContainer>
        <div className="flex w-full [&>button]:w-full">
          <SubmitWhenConnectedToChain
            chainId={hemi.id}
            submitButton={
              <Button disabled={isRunningOperation} size="small">
                {submitLabel}
              </Button>
            }
            submitButtonSize="small"
          />
        </div>
      </CallToActionContainer>
    </form>
  )
}
