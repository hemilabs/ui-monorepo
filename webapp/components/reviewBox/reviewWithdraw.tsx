import { hemi } from 'app/networks'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import { AllOrNone } from 'types/utility'
import { Card } from 'ui-common/components/card'
import type { Chain, Hash } from 'viem'
import { useConfig } from 'wagmi'

import { Heading, getValue, SubSection } from './index'

const ExpectedWithdrawalWaitTimeMinutes = 10
const ExpectedProofWaitTimeHours = 2

type ProgressStatus = 'completed' | 'idle' | 'progress'

type StepProps = {
  chainId?: Chain['id']
  icon: ReactNode
  isWaitTimeStep?: boolean
  status: ProgressStatus
  text: string
  transactionHash?: Hash
} & AllOrNone<{
  gas: string
  symbol: string
}>

const ArrowIcon = () => (
  <svg fill="none" height={16} width={17} xmlns="http://www.w3.org/2000/svg">
    <path
      d="m14.354 8.354-4.5 4.5a.5.5 0 0 1-.708-.708L12.793 8.5H3a.5.5 0 1 1 0-1h9.793L9.146 3.854a.5.5 0 1 1 .708-.708l4.5 4.5a.502.502 0 0 1 0 .708Z"
      fill="#1A1C20"
    />
  </svg>
)

const CheckIcon = () => (
  <svg fill="none" height={12} width={13} xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M6.5 11a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm2.296-6.27a.375.375 0 0 0-.592-.46L6.2 6.846a.125.125 0 0 1-.182.016l-1.267-1.14a.375.375 0 0 0-.502.557l1.267 1.14a.875.875 0 0 0 1.277-.113L8.796 4.73Z"
      fill="#01AE33"
      fillRule="evenodd"
    />
  </svg>
)

const ClockIcon = () => (
  <svg fill="none" height={12} width={13} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.5 1a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm2.1 7.1L6 6.5v-3h.75v2.6L9 7.45l-.4.65Z"
      fill="#F80"
    />
  </svg>
)

const FuelIcon = () => (
  <svg fill="none" height={16} width={17} xmlns="http://www.w3.org/2000/svg">
    <path
      d="m15.563 4.354-1.21-1.208a.5.5 0 0 0-.707.708l1.208 1.208a.5.5 0 0 1 .146.352V10.5a.5.5 0 0 1-1 0V8a1.5 1.5 0 0 0-1.5-1.5h-1v-3A1.5 1.5 0 0 0 10 2H5a1.5 1.5 0 0 0-1.5 1.5V13h-1a.5.5 0 0 0 0 1h10a.5.5 0 0 0 0-1h-1V7.5h1a.5.5 0 0 1 .5.5v2.5a1.5 1.5 0 1 0 3 0V5.414a1.49 1.49 0 0 0-.438-1.06ZM4.5 13V3.5A.5.5 0 0 1 5 3h5a.5.5 0 0 1 .5.5V13h-6Zm5-6a.5.5 0 0 1-.5.5H6a.5.5 0 1 1 0-1h3a.5.5 0 0 1 .5.5Z"
      fill="#1A1C20"
    />
  </svg>
)

const PlaneIcon = () => (
  <svg fill="none" height={12} width={13} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.156 1.345a.75.75 0 0 0-.734-.192h-.007l-8.997 2.73a.75.75 0 0 0-.114 1.399l4.014 1.9 1.9 4.014a.744.744 0 0 0 .741.426.744.744 0 0 0 .656-.54l2.729-8.996v-.007a.75.75 0 0 0-.188-.735Zm-3.257 9.523-.003.007L6.051 6.98l2.215-2.215a.375.375 0 0 0-.53-.53L5.52 6.449 1.625 4.604h.007l8.993-2.729L7.9 10.868Z"
      fill="#999"
    />
  </svg>
)

const ProveIcon = () => (
  <svg fill="none" height={12} width={13} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.25 1.875h-7.5a.75.75 0 0 0-.75.75V5.38c0 4.2 3.554 5.594 4.266 5.83a.724.724 0 0 0 .468 0C7.447 10.973 11 9.58 11 5.38V2.624a.75.75 0 0 0-.75-.75Zm0 3.506c0 3.676-3.11 4.904-3.75 5.118-.634-.211-3.75-1.439-3.75-5.118V2.625h7.5v2.756ZM4.625 6A.375.375 0 0 1 5 5.625h1.125V4.5a.375.375 0 1 1 .75 0v1.125H8a.375.375 0 0 1 0 .75H6.875V7.5a.375.375 0 0 1-.75 0V6.375H5A.375.375 0 0 1 4.625 6Z"
      fill="#999"
    />
  </svg>
)

const VerticalLine = function ({ status }: { status: ProgressStatus }) {
  const styles = {
    completed: 'border-green-500',
    idle: 'border-stone-300',
    progress: 'animate-withdraw-progress border-green-500',
  }
  return (
    <div className="h-5">
      <div
        className={`ml-5 h-5 w-px border-l border-dotted ${styles[status]}`}
      />
    </div>
  )
}

const WaitIcon = () => (
  <svg fill="none" height={12} width={13} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.875 3.75v2.038l1.693 1.015a.375.375 0 0 1-.386.643L6.307 6.321A.375.375 0 0 1 6.125 6V3.75a.375.375 0 0 1 .75 0ZM11 2.625a.375.375 0 0 0-.375.375v.844a20.335 20.335 0 0 0-.943-1.024 4.5 4.5 0 1 0-.094 6.455.375.375 0 0 0-.515-.546 3.75 3.75 0 1 1 .078-5.382c.381.386.715.758 1.052 1.153H9.125a.375.375 0 1 0 0 .75H11a.375.375 0 0 0 .375-.375V3A.375.375 0 0 0 11 2.625Z"
      fill="#999"
    />
  </svg>
)

const Step = function ({
  chainId,
  icon,
  isWaitTimeStep = false,
  text,
  status,
  transactionHash,
  ...props
}: StepProps) {
  const { chains } = useConfig()
  const t = useTranslations('bridge-page.review-withdraw')

  const icons = {
    completed: <CheckIcon />,
    idle: icon,
    progress: isWaitTimeStep ? <ClockIcon /> : icon,
  }

  const background = {
    completed: 'bg-green-500/10',
    idle: 'bg-gray-200',
    progress: 'bg-orange-hemi/10',
  }

  return (
    <div className="flex items-center gap-x-2 rounded-lg bg-zinc-50 p-2 text-xs font-medium md:text-sm">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full ${background[status]}`}
      >
        {icons[status]}
      </div>
      <p className="mr-auto text-zinc-400">{text}</p>
      {'gas' in props && 'symbol' in props && !transactionHash ? (
        <>
          <span className="text-[10px] font-normal sm:text-xs">
            {props.gas === '0'
              ? '-'
              : t('gas-estimated', { ...props, gas: getValue(props.gas) })}
          </span>
          <FuelIcon />
        </>
      ) : null}
      {transactionHash && chainId ? (
        <a
          className="flex cursor-pointer items-center gap-x-2"
          href={`${
            chains.find(c => c.id === chainId).blockExplorers.default.url
          }/tx/${transactionHash}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="text-zinc-900">{t('view-tx')}</span>
          <ArrowIcon />
        </a>
      ) : null}
    </div>
  )
}
// Unsure why this is picked up. I believe it is a bug.
// There are cases where enum may make this rule to be an error
// but I don't think (or can't see) how this is the case.
// See https://typescript-eslint.io/rules/no-shadow/#why-does-the-rule-report-on-enum-members-that-share-the-same-name-as-a-variable-in-a-parent-scope
// for more info.
// eslint-disable-next-line no-shadow
export enum WithdrawProgress {
  IDLE,
  WITHDRAWING,
  WITHDRAW_NOT_PUBLISHED,
  READY_TO_PROVE,
  PROVING,
  WAITING_FOR_CLAIM_ENABLED,
  READY_TO_CLAIM,
  CLAIMING,
  CLAIMED,
}

type Props = {
  gas: string
  gasSymbol: string
  progress: WithdrawProgress
  toWithdraw: string
  withdrawSymbol: string
  withdrawTxHash?: Hash
} & (
  | { canWithdraw: boolean; operation: 'withdraw' }
  | {
      operation: 'prove'
      proveWithdrawalTxHash?: Hash
    }
  | {
      operation: 'claim'
      proveWithdrawalTxHash: Hash
      claimWithdrawalTxHash?: Hash
    }
)
export const ReviewWithdraw = function ({
  gas,
  gasSymbol,
  progress,
  toWithdraw,
  withdrawSymbol,
  withdrawTxHash,
  ...props
}: Props) {
  const t = useTranslations('bridge-page.review-withdraw')

  const getProgressStatus = function (step: WithdrawProgress): ProgressStatus {
    if (progress > step) return 'completed'
    if (progress === step) return 'progress'
    return 'idle'
  }

  const isClaim = props.operation === 'claim'
  const isProve = props.operation === 'prove'
  const isWithdraw = props.operation === 'withdraw'

  return (
    <Card>
      <Heading text={t('heading')} />
      <SubSection
        symbol={withdrawSymbol}
        text={t('total-to-withdraw')}
        value={isWithdraw && props.canWithdraw ? toWithdraw : '0'}
      />
      <Step
        chainId={hemi.id}
        icon={<PlaneIcon />}
        status={getProgressStatus(WithdrawProgress.WITHDRAWING)}
        text={t('initiate-withdrawal')}
        transactionHash={withdrawTxHash}
        {...(isWithdraw
          ? {
              gas,
              symbol: gasSymbol,
            }
          : {})}
      />
      <VerticalLine status={getProgressStatus(WithdrawProgress.WITHDRAWING)} />
      <Step
        icon={
          progress === WithdrawProgress.WITHDRAW_NOT_PUBLISHED ? (
            <ClockIcon />
          ) : (
            <WaitIcon />
          )
        }
        isWaitTimeStep
        status={getProgressStatus(WithdrawProgress.WITHDRAW_NOT_PUBLISHED)}
        text={t('wait-minutes', { minutes: ExpectedWithdrawalWaitTimeMinutes })}
      />
      <VerticalLine
        status={getProgressStatus(WithdrawProgress.WITHDRAW_NOT_PUBLISHED)}
      />
      <Step
        icon={<ProveIcon />}
        status={getProgressStatus(WithdrawProgress.PROVING)}
        text={t('prove-withdrawal')}
        {...(isProve
          ? {
              gas,
              symbol: gasSymbol,
            }
          : {})}
        transactionHash={
          isProve && props.proveWithdrawalTxHash
            ? props.proveWithdrawalTxHash
            : undefined
        }
      />
      <VerticalLine status={getProgressStatus(WithdrawProgress.PROVING)} />
      <Step
        icon={<WaitIcon />}
        isWaitTimeStep
        status={getProgressStatus(WithdrawProgress.WAITING_FOR_CLAIM_ENABLED)}
        text={t('wait-hours', { hours: ExpectedProofWaitTimeHours })}
      />
      <VerticalLine
        status={getProgressStatus(WithdrawProgress.WAITING_FOR_CLAIM_ENABLED)}
      />
      <Step
        icon={<PlaneIcon />}
        status={getProgressStatus(WithdrawProgress.CLAIMED)}
        text={t('claim-withdrawal')}
        {...(isClaim
          ? {
              gas,
              symbol: gasSymbol,
            }
          : {})}
        transactionHash={
          isClaim && props.claimWithdrawalTxHash
            ? props.claimWithdrawalTxHash
            : undefined
        }
      />
    </Card>
  )
}
