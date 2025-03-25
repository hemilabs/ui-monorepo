import { DisplayAmount } from 'components/displayAmount'
import { GreenCheckIcon } from 'components/icons/greenCheckIcon'
import { RedErrorIcon } from 'components/icons/redErrorIcon'
import { ShortVerticalLine, LongVerticalLine } from 'components/verticalLines'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'

import { ClockIcon } from './_icons/clockIcon'
import { FeesIcon } from './_icons/feesIcon'
import { OneRowBox, TwoRowBox } from './box'
import { PositionStatus } from './positionStatus'
import { ProgressStatus } from './progressStatus'
import { SeeOnExplorer } from './seeOnExplorer'
import { Separator } from './separator'
import { SubStep } from './subStep'

type Props = {
  description: string
  fees?:
    | {
        amount: string
        token: Token
      }
    | undefined
  explorerChainId?: RemoteChain['id']
  position: number
  postAction?: {
    description: string
    loading?: boolean
    status: ProgressStatus
  }
  separator?: boolean
  txHash?: string
}

const Fees = ({ amount, token }: Props['fees']) => (
  <>
    <FeesIcon />
    <div className="ml-1 text-neutral-950">
      <DisplayAmount amount={amount} showTokenLogo={false} token={token} />
    </div>
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
      <TwoRowBox
        bottom={
          txHash ? (
            <>
              <GreenCheckIcon />
              <span className="mr-auto text-emerald-500">{t('confirmed')}</span>
              <SeeOnExplorer chainId={explorerChainId} txHash={txHash} />
            </>
          ) : null
        }
        top={{
          bgColor: 'bg-neutral-50',
          children: (
            <span className="mr-auto text-neutral-600">{description}</span>
          ),
        }}
      />
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
    <OneRowBox bgColor="bg-neutral-100">
      <span className="text-neutral-600">{description}</span>
    </OneRowBox>
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
      <TwoRowBox
        bottom={
          <>
            <ClockIcon />
            <span className="mr-auto text-neutral-500">{t('pending')}</span>
            <SeeOnExplorer chainId={explorerChainId} txHash={txHash} />
          </>
        }
        top={{
          bgColor: 'bg-white',
          children: (
            <>
              <span className="mr-auto text-orange-500">{description}</span>
              {fees && <Fees {...fees} />}
            </>
          ),
        }}
      />
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
    <OneRowBox bgColor="bg-white">
      <span className="mr-auto text-orange-500">{description}</span>
      {fees && <Fees {...fees} />}
    </OneRowBox>
    {!!postAction && (
      <div className="left-2.25 absolute bottom-6">
        <ShortVerticalLine stroke="stroke-neutral-300/55" />
      </div>
    )}
  </>
)

const Failed = function ({
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
        <PositionStatus position={position} status={ProgressStatus.FAILED} />
      </div>
      <TwoRowBox
        bottom={
          txHash ? (
            <>
              <RedErrorIcon />
              <span className="mr-auto text-rose-500">{t('error')}</span>
              <SeeOnExplorer chainId={explorerChainId} txHash={txHash} />
            </>
          ) : null
        }
        top={{
          bgColor: 'bg-white',
          children: (
            <>
              <span className="mr-auto text-rose-500">{description}</span>
              {fees && <Fees {...fees} />}
            </>
          ),
        }}
      />
      {!!postAction && (
        <div className="left-2.25 absolute bottom-6">
          <ShortVerticalLine stroke="stroke-neutral-300/55" />
        </div>
      )}
    </>
  )
}

const Rejected = function ({ description, fees, position, postAction }: Props) {
  const t = useTranslations('common.transaction-status')
  return (
    <>
      <div className="left-2.25 absolute top-0.5">
        <ShortVerticalLine stroke="stroke-orange-500" />
      </div>
      <div className="mt-4">
        <PositionStatus position={position} status={ProgressStatus.REJECTED} />
      </div>
      <TwoRowBox
        bottom={
          <>
            <RedErrorIcon />
            <span className="mr-auto text-rose-500">{t('rejected')}</span>
          </>
        }
        top={{
          bgColor: 'bg-white',
          children: (
            <>
              <span className="mr-auto text-orange-500">{description}</span>
              {fees && <Fees {...fees} />}
            </>
          ),
        }}
      />
      {!!postAction && (
        <div className="left-2.25 absolute bottom-6">
          <ShortVerticalLine stroke="stroke-neutral-300/55" />
        </div>
      )}
    </>
  )
}

const statusMap = {
  [ProgressStatus.NOT_READY]: NotReady,
  [ProgressStatus.READY]: Ready,
  [ProgressStatus.PROGRESS]: Progress,
  [ProgressStatus.COMPLETED]: Completed,
  [ProgressStatus.FAILED]: Failed,
  [ProgressStatus.REJECTED]: Rejected,
}

export const Step = function ({
  status,
  ...props
}: Props & { status: ProgressStatus }) {
  const StatusStep = statusMap[status]
  return (
    <>
      {props.separator && <Separator />}
      <div className="relative flex flex-col gap-y-1 text-sm font-medium">
        <div className="flex items-start gap-x-3 py-3">
          <StatusStep {...props} />
        </div>
        {props.postAction ? <SubStep {...props.postAction} /> : null}
      </div>
    </>
  )
}

export type StepPropsWithoutPosition = Omit<
  ComponentProps<typeof Step>,
  'position'
>
