import { useTranslations } from 'next-intl'
import { RemoteChain } from 'types/chain'
import { getFormattedValue } from 'utils/format'

import { ClockIcon } from './icons/clockIcon'
import { FeesIcon } from './icons/feesIcon'
import { GreenCheckIcon } from './icons/greenCheckIcon'
import { PositionStatus } from './positionStatus'
import { ProgressStatus } from './progressStatus'
import { SeeOnExplorer } from './seeOnExplorer'
import { SubStep } from './subStep'
import { ShortVerticalLine, LongVerticalLine } from './verticalLines'

type Props = {
  description: string
  fees?:
    | {
        amount: string
        symbol: string
      }
    | undefined
  explorerChainId?: RemoteChain['id']
  position: number
  postAction?: {
    description: string
    status: ProgressStatus
  }
  txHash?: string
}

const upperBoxCommonCss =
  'rounded-lg border border-solid border-neutral-300/55 bg-neutral-100 p-4 h-13 w-full'

const bottomBoxCommonCss = `flex h-14 items-center rounded-lg w-full gap-x-1
  border border-solid border-neutral-300/55 bg-neutral-100 px-4 pt-6 pb-4`

const Fees = ({ amount, symbol }: Props['fees']) => (
  <>
    <FeesIcon />
    <span className="ml-1 text-neutral-950">{`${getFormattedValue(
      amount,
    )} ${symbol}`}</span>
  </>
)

const Completed = function ({
  description,
  explorerChainId,
  position,
  postAction,
  txHash,
}: Props) {
  const t = useTranslations('common.transaction-status')
  return (
    <>
      <div className="left-2.25 absolute top-0.5">
        <ShortVerticalLine stroke="stroke-orange-500" />
      </div>
      <div className="mt-4">
        <PositionStatus position={position} status={ProgressStatus.COMPLETED} />
      </div>
      <div className="flex w-full flex-col">
        <div className={`${upperBoxCommonCss} z-10 -mb-3 bg-neutral-50`}>
          <span className="mr-auto text-neutral-500">{description}</span>
        </div>
        <div className={bottomBoxCommonCss}>
          <GreenCheckIcon />
          <span className="mr-auto text-emerald-500">{t('confirmed')}</span>
          <SeeOnExplorer chainId={explorerChainId} txHash={txHash} />
        </div>
      </div>
      {!!postAction && (
        <div className="left-2.25 absolute bottom-6">
          <LongVerticalLine stroke="stroke-orange-500" />
        </div>
      )}
    </>
  )
}

const NotReady = ({ description, position, postAction }: Props) => (
  <>
    <div className="left-2.25 absolute top-0.5">
      <ShortVerticalLine stroke="stroke-neutral-300/55" />
    </div>
    <div className="mt-4">
      <PositionStatus position={position} status={ProgressStatus.NOT_READY} />
    </div>
    <div className={`${upperBoxCommonCss} bg-neutral-100`}>
      <span className="text-neutral-600">{description}</span>
    </div>
    {!!postAction && (
      <div className="left-2.25 absolute bottom-6">
        <ShortVerticalLine stroke="stroke-neutral-300/55" />
      </div>
    )}
  </>
)

const Progress = function ({
  description,
  explorerChainId,
  fees,
  position,
  postAction,
  txHash,
}: Props) {
  const t = useTranslations('common.transaction-status')
  return (
    <>
      <div className="left-2.25 absolute top-0.5">
        <ShortVerticalLine stroke="stroke-orange-500" />
      </div>
      <div className="mt-4">
        <PositionStatus position={position} status={ProgressStatus.PROGRESS} />
      </div>
      <div className="flex w-full flex-col">
        <div
          className={`${upperBoxCommonCss} z-10 -mb-3 flex items-center justify-between bg-white`}
        >
          <span className="mr-auto text-orange-500">{description}</span>
          {fees && <Fees {...fees} />}
        </div>
        <div className={bottomBoxCommonCss}>
          <ClockIcon />
          <span className="mr-auto text-neutral-500">{t('pending')}</span>
          <SeeOnExplorer chainId={explorerChainId} txHash={txHash} />
        </div>
      </div>
      {!!postAction && (
        <div className="left-2.25 absolute bottom-6">
          <LongVerticalLine stroke="stroke-neutral-300/55" />
        </div>
      )}
    </>
  )
}

const Ready = ({ description, fees, position, postAction }: Props) => (
  <>
    <div className="left-2.25 absolute top-0.5">
      <ShortVerticalLine stroke="stroke-orange-500" />
    </div>
    <div className="mt-4">
      <PositionStatus position={position} status={ProgressStatus.READY} />
    </div>
    <div className={`${upperBoxCommonCss} flex items-center bg-white`}>
      <span className="mr-auto text-orange-500">{description}</span>
      {fees && <Fees {...fees} />}
    </div>
    {!!postAction && (
      <div className="left-2.25 absolute bottom-6">
        <ShortVerticalLine stroke="stroke-neutral-300/55" />
      </div>
    )}
  </>
)

const statusMap = {
  [ProgressStatus.NOT_READY]: NotReady,
  [ProgressStatus.READY]: Ready,
  [ProgressStatus.PROGRESS]: Progress,
  [ProgressStatus.COMPLETED]: Completed,
}

export const Step = function ({
  status,
  ...props
}: Props & { status: ProgressStatus }) {
  const StatusStep = statusMap[status]
  return (
    <div className="text-ms relative flex flex-col gap-y-1 font-medium leading-5">
      <div className="flex items-start gap-x-3 py-3">
        <StatusStep {...props} />
      </div>
      {props.postAction ? <SubStep {...props.postAction} /> : null}
    </div>
  )
}
