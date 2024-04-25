import { MessageStatus, TokenBridgeMessage } from '@eth-optimism/sdk'
import { bridgeableNetworks, hemi } from 'app/networks'
import { TransactionStatus } from 'components/transactionStatus'
import {
  useAnyChainGetTransactionMessageStatus,
  useGetWithdrawalsByAddress,
} from 'hooks/useL2Bridge'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Card } from 'ui-common/components/card'
import { Modal } from 'ui-common/components/modal'
import { formatNumber, getFormattedValue } from 'utils/format'
import { getL2TokenByBridgedAddress, getTokenByAddress } from 'utils/token'
import { Address, formatUnits } from 'viem'

import { useTunnelOperation } from '../_hooks/useTunnelState'

const ExpectedWithdrawalWaitTimeMinutes = 20
const ExpectedProofWaitTimeHours = 3

type ProgressStatus = 'completed' | 'idle' | 'progress' | 'ready'

const CheckIcon = () => (
  <svg
    fill="none"
    height="17"
    viewBox="0 0 17 17"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5 6.83333L7.5 10.5L6.16667 9.16667M14.5 8.5C14.5 11.8137 11.8137 14.5 8.5 14.5C5.18629 14.5 2.5 11.8137 2.5 8.5C2.5 5.18629 5.18629 2.5 8.5 2.5C11.8137 2.5 14.5 5.18629 14.5 8.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.33333"
    />
  </svg>
)

const ClaimIcon = () => (
  <svg
    fill="none"
    height="17"
    viewBox="0 0 17 17"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.83317 5.83333H10.1665M6.83317 5.83333C6.83317 5.83333 3.16648 7.83333 3.1665 11.1667C3.16652 13.8471 5.81938 14.5 8.49984 14.5C11.1803 14.5 13.8332 13.8471 13.8332 11.1667C13.8332 7.83333 10.1665 5.83333 10.1665 5.83333M6.83317 5.83333L6.20467 4.15734C5.9871 3.57713 6.20816 2.92749 6.80089 2.74677C7.2381 2.61347 7.81224 2.5 8.49984 2.5C9.18744 2.5 9.76157 2.61347 10.1988 2.74677C10.7915 2.92749 11.0126 3.57713 10.795 4.15734L10.1665 5.83333"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.33333"
    />
  </svg>
)

const ClockIcon = () => (
  <svg
    fill="none"
    height="17"
    viewBox="0 0 17 17"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 3.83337V6.50004H5.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M2.84113 10.5C3.6648 12.8304 5.88727 14.5 8.49971 14.5C11.8134 14.5 14.4997 11.8137 14.4997 8.5C14.4997 5.18629 11.8134 2.5 8.49971 2.5C6.01361 2.5 3.88066 4.01204 2.97032 6.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M8.5 5.83337V8.50004L10.5 10.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="25"
    viewBox="0 0 25 25"
    width="25"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5.5 5.5L19.5 19.5M19.5 5.5L5.5 19.5"
      stroke="black"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
)

const CursorIcon = () => (
  <svg
    fill="none"
    height="17"
    viewBox="0 0 17 17"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.25197 14.6016C9.4207 15.2483 10.3301 15.2721 10.5324 14.6352L13.9444 3.89363C14.1081 3.37832 13.6226 2.89274 13.1072 3.05643L2.36573 6.46843C1.72874 6.67077 1.75257 7.58022 2.39928 7.74889L7.45604 9.06802C7.68957 9.12895 7.8719 9.31135 7.93284 9.54482L9.25197 14.6016Z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)

const FuelIcon = () => (
  <svg
    fill="none"
    height="17"
    viewBox="0 0 17 17"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.83333 13.8333H10.5M9.83333 13.8333V7.16663M9.83333 13.8333H3.16667M9.83333 7.16663V4.49996C9.83333 3.76358 9.2364 3.16663 8.5 3.16663H4.5C3.76362 3.16663 3.16667 3.76358 3.16667 4.49996V13.8333M9.83333 7.16663H11.1667C11.9031 7.16663 12.5 7.76356 12.5 8.49996V10.8333C12.5 11.3856 12.9477 11.8333 13.5 11.8333C14.0523 11.8333 14.5 11.3856 14.5 10.8333V6.38558C14.5 6.03195 14.3595 5.69282 14.1095 5.44277L13.1667 4.49996M3.16667 13.8333H2.5M7.83333 7.16663H5.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.33333"
    />
  </svg>
)

const ProveIcon = () => (
  <svg
    fill="none"
    height="19"
    viewBox="0 0 19 19"
    width="19"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.62634 9.87518L8.48615 10.735C8.63263 10.8815 8.87008 10.8815 9.01648 10.735L11.3764 8.37518M7.19494 4.44473L5.66095 4.20139C5.19705 4.1278 4.77532 4.48168 4.76724 4.9513L4.74051 6.50424C4.73592 6.7708 4.59426 7.01617 4.36571 7.15342L3.03419 7.95304C2.63152 8.19488 2.53592 8.73698 2.8316 9.10193L3.80934 10.3088C3.97716 10.5159 4.02636 10.7949 3.9395 11.047L3.43348 12.5154C3.28046 12.9595 3.55572 13.4363 4.01681 13.5257L5.54152 13.8218C5.80322 13.8725 6.02026 14.0546 6.11575 14.3036L6.672 15.7538C6.84022 16.1923 7.35754 16.3805 7.76829 16.1528L9.12658 15.3995C9.35968 15.2701 9.64303 15.2701 9.87613 15.3995L11.2344 16.1528C11.6452 16.3805 12.1625 16.1923 12.3307 15.7538L12.8869 14.3036C12.9824 14.0546 13.1995 13.8725 13.4612 13.8218L14.9859 13.5257C15.447 13.4363 15.7222 12.9595 15.5692 12.5154L15.0632 11.047C14.9764 10.7949 15.0256 10.5159 15.1933 10.3088L16.1711 9.10193C16.4668 8.73698 16.3711 8.19488 15.9685 7.95304L14.637 7.15342C14.4085 7.01617 14.2668 6.7708 14.2622 6.50424L14.2354 4.9513C14.2273 4.48168 13.8056 4.1278 13.3417 4.20139L11.8078 4.44473C11.5444 4.48651 11.2782 4.3896 11.1034 4.18836L10.0847 3.01592C9.7766 2.66136 9.2261 2.66136 8.918 3.01592L7.89933 4.18836C7.72447 4.3896 7.45824 4.4865 7.19494 4.44473Z"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </svg>
)

const Amount = function ({
  withdrawal,
}: {
  withdrawal?: Partial<TokenBridgeMessage>
}) {
  if (!withdrawal) {
    return <Skeleton containerClassName="w-5" />
  }
  const token =
    getTokenByAddress(withdrawal.l2Token as Address, hemi.id) ??
    getL2TokenByBridgedAddress(
      withdrawal.l2Token as Address,
      // TODO l1chainID
      bridgeableNetworks[0].id,
    )

  return (
    <span className="text-sm font-medium text-slate-950">
      {`${getFormattedValue(
        formatNumber(
          formatUnits(withdrawal.amount.toBigInt(), token?.decimals ?? 18),
          3,
        ),
      )} ${token?.symbol ?? ''}`}
    </span>
  )
}

const backgroundColors = {
  completed: 'bg-green-500/20',
  idle: 'bg-zinc-50',
  progress: 'bg-orange-600/20',
  // uses same color as progress :shrug:
  ready: 'bg-orange-600/20',
}

const iconColors = {
  completed: '[&>svg>path]:stroke-green-600',
  idle: '[&>svg>path]:stroke-slate-500',
  progress: '[&>svg>path]:stroke-orange-600',
  // uses same color as progress :shrug:
  ready: '[&>svg>path]:stroke-orange-600',
}

const textColors = {
  completed: 'text-green-600',
  idle: 'text-slate-500',
  progress: 'text-orange-600',
  ready: 'text-orange-600',
}

type StepProps = {
  gas?: {
    amount: string
    symbol: string
  }
  icon: ReactNode
  isLoading: boolean
  status: ProgressStatus
  text: string
}

const Step = function ({ gas, icon, isLoading, text, status }: StepProps) {
  const border = status === 'idle' ? 'border border-solid border-slate-100' : ''
  return (
    <>
      {isLoading && (
        <Skeleton className="h-full" containerClassName="block h-9 w-full" />
      )}
      {!isLoading && (
        <div
          className={`flex items-center gap-x-2 rounded-lg p-2 text-xs font-medium md:text-sm ${backgroundColors[status]} ${border} ${textColors[status]}`}
        >
          <div className={iconColors[status]}>
            {status === 'completed' ? <CheckIcon /> : icon}
          </div>
          <p className="mr-auto">{text}</p>
          {gas && status !== 'completed' ? (
            <>
              <div className={iconColors[status]}>
                <FuelIcon />
              </div>
              <span className="text-[10px] font-normal sm:text-xs">
                {gas.amount === '0'
                  ? '-'
                  : `${getFormattedValue(gas.amount)} ${gas.symbol}`}
              </span>
            </>
          ) : null}
        </div>
      )}
    </>
  )
}

type SubStepProps = {
  isLoading: boolean
  status: ProgressStatus
  text: string
}
const SubStep = function ({ isLoading, status, text }: SubStepProps) {
  const t = useTranslations('tunnel-page.review-withdraw')

  if (isLoading) {
    return <Skeleton containerClassName="block h-5 w-full" />
  }

  const completed = status === 'completed'
  return (
    <div
      className={`flex items-center gap-x-2 px-2 text-xs font-medium ${
        iconColors[status] ?? iconColors.idle
      }`}
    >
      {completed ? <CheckIcon /> : <ClockIcon />}
      <span className={textColors[status] ?? textColors.idle}>
        {completed ? t('wait-complete') : text}
      </span>
    </div>
  )
}

const VerticalLine = () => (
  <div className="ml-4 py-1">
    <div className="mb-3 h-2 w-[2px] bg-slate-100"></div>
    <div className="h-2 w-[2px] bg-slate-100"></div>
  </div>
)

type ReviewWithdrawalProps = {
  gas?: {
    amount: string
    symbol: string
  }
  isRunningOperation: boolean
  onSubmit?: () => void
  submitButton?: ReactNode
  transactionsList?: {
    id: string
    status: React.ComponentProps<typeof TransactionStatus>['status']
    text: string
    txHash: string
  }[]
  withdrawal?: Partial<TokenBridgeMessage>
}

export const ReviewWithdrawal = function ({
  gas,
  isRunningOperation,
  onSubmit,
  submitButton,
  transactionsList = [],
  withdrawal,
}: ReviewWithdrawalProps) {
  // https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = bridgeableNetworks[0].id

  const router = useRouter()
  const locale = useLocale()

  const t = useTranslations('tunnel-page.review-withdraw')
  const { operation, txHash } = useTunnelOperation()

  const { isLoadingMessageStatus, messageStatus } =
    useAnyChainGetTransactionMessageStatus({
      l1ChainId,
      transactionHash: txHash,
    })

  const { withdrawals = [] } = useGetWithdrawalsByAddress()

  const getClaimStatus = function () {
    if (messageStatus < MessageStatus.READY_FOR_RELAY) return 'idle'
    if (messageStatus === MessageStatus.RELAYED) return 'completed'
    if (isRunningOperation) return 'progress'
    return 'ready'
  }

  const getProveStatus = function () {
    if (messageStatus < MessageStatus.READY_TO_PROVE) return 'idle'
    if (messageStatus > MessageStatus.READY_TO_PROVE) return 'completed'
    if (isRunningOperation) return 'progress'
    return 'ready'
  }

  const getWithdrawalProgress = () =>
    messageStatus >= MessageStatus.STATE_ROOT_NOT_PUBLISHED
      ? 'completed'
      : 'progress'

  const getWaitReadyToProveStatus = function () {
    if (messageStatus >= MessageStatus.READY_TO_PROVE) {
      return 'completed'
    }
    const withdrawalStatus = getWithdrawalProgress()
    if (withdrawalStatus === 'completed') {
      return 'progress'
    }
    return 'idle'
  }

  const getWaitReadyToClaimStatus = function () {
    if (
      [MessageStatus.READY_FOR_RELAY, MessageStatus.RELAYED].includes(
        messageStatus,
      )
    ) {
      return 'completed'
    }
    const proveStatus = getProveStatus()
    if (proveStatus === 'completed') {
      return 'progress'
    }
    return 'idle'
  }

  const isClaim = operation === 'claim'
  const isProve = operation === 'prove'
  const isWithdraw = operation === 'withdraw'

  const isLoading = isLoadingMessageStatus

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    onSubmit()
  }

  // when starting from "Prove", amount is not available in the partial withdrawal
  // so we must go to the full list of withdrawals to find the amount
  const foundWithdrawal =
    withdrawal && withdrawal.amount
      ? withdrawal
      : withdrawals.find(w => w.transactionHash === txHash)

  const closeModal = function () {
    // prevent closing if running an operation
    if (isRunningOperation) {
      return
    }
    // redirect to the withdraw form.
    router.push(`/${locale}/tunnel?operation=withdraw`)
  }

  return (
    <Modal onClose={closeModal}>
      <div className="flex w-96 flex-col gap-y-4">
        <Card padding="large">
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-base font-medium text-slate-950 lg:text-xl">
              {t('heading')}
            </h4>
            <CloseIcon className="cursor-pointer" onClick={closeModal} />
          </div>
          <div className="flex items-center justify-between py-4">
            <span className="text-xs font-medium text-slate-500">
              {t('total-amount')}
            </span>
            <Amount withdrawal={foundWithdrawal} />
          </div>
          <Step
            gas={isWithdraw && gas}
            icon={<CursorIcon />}
            isLoading={isLoading}
            status={getWithdrawalProgress()}
            text={t('initiate-withdrawal')}
          />
          <VerticalLine />
          <SubStep
            isLoading={isLoading}
            status={getWaitReadyToProveStatus()}
            text={t('wait-minutes', {
              minutes: ExpectedWithdrawalWaitTimeMinutes,
            })}
          />
          <VerticalLine />
          <Step
            gas={isProve && gas}
            icon={<ProveIcon />}
            isLoading={isLoading}
            status={getProveStatus()}
            text={t('prove-withdrawal')}
          />
          <VerticalLine />
          <SubStep
            isLoading={isLoading}
            status={getWaitReadyToClaimStatus()}
            text={t('wait-hours', { hours: ExpectedProofWaitTimeHours })}
          />
          <VerticalLine />
          <Step
            gas={isClaim && gas}
            icon={<ClaimIcon />}
            isLoading={isLoading}
            status={getClaimStatus()}
            text={t('claim-withdrawal')}
          />
          {
            <form className="mt-6" onSubmit={handleSubmit}>
              {submitButton}
            </form>
          }
        </Card>
        {transactionsList.length > 0 && (
          <div className="flex flex-col gap-y-4">
            {transactionsList.map(transaction => (
              <TransactionStatus
                key={transaction.id}
                status={transaction.status}
                text={transaction.text}
                txHash={transaction.txHash}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
