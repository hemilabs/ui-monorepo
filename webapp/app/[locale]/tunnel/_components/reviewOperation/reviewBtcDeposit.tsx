import { RemoteChain } from 'app/networks'
import { TransactionStatus } from 'components/transactionStatus'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useTranslations } from 'next-intl'
import { type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { Token } from 'types/token'
import { BtcDepositStatus } from 'types/tunnel'
import { Card } from 'ui-common/components/card'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { Modal } from 'ui-common/components/modal'

import { useTunnelOperation } from '../../_hooks/useTunnelOperation'

import { Amount } from './amount'
import { ClaimIcon } from './claimIcon'
import { Step, SubStep } from './steps'
import { VerticalLine } from './verticalLine'

const ExpectedClaimDepositTimeHours = 3

const DepositIcon = () => (
  <svg fill="none" height={17} width={16} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.752 14.602c.169.647 1.078.67 1.28.034l3.413-10.742a.667.667 0 0 0-.838-.837L1.866 6.469c-.637.202-.613 1.112.033 1.28l5.057 1.32c.234.06.416.243.477.476l1.32 5.057Z"
      stroke="#4D4E4E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </svg>
)

type ReviewBtcDeposit = {
  chain: RemoteChain
  fees?: {
    amount: string
    symbol: string
  }
  isRunningOperation: boolean
  onClose?: () => void
  onSubmit?: () => void
  submitButton?: ReactNode
  token: Token
  transactionsList?: {
    id: string
    status: ComponentProps<typeof TransactionStatus>['status']
    text: string
    txHash: string
  }[]
}

export const ReviewBtcDeposit = function ({
  chain,
  fees,
  isRunningOperation,
  onClose,
  onSubmit,
  submitButton,
  token,
  transactionsList,
}: ReviewBtcDeposit) {
  const deposits = useBtcDeposits()
  const t = useTranslations()
  const { operation, txHash } = useTunnelOperation()

  const foundDeposit = deposits.find(
    deposit => deposit.transactionHash === txHash,
  )

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    onSubmit()
  }

  const closeModal = function () {
    // prevent closing if running an operation
    if (isRunningOperation) {
      return
    }
    onClose?.()
    window.history.back()
  }

  const getWaitReadyToClaimStatus = function () {
    if (foundDeposit.status >= BtcDepositStatus.BTC_READY_CLAIM) {
      return 'completed'
    }
    return foundDeposit.status === BtcDepositStatus.TX_CONFIRMED
      ? 'progress'
      : 'idle'
  }

  const getClaimStatus = function () {
    if (foundDeposit.status === BtcDepositStatus.BTC_DEPOSITED) {
      return 'completed'
    }
    if (foundDeposit.status === BtcDepositStatus.BTC_READY_CLAIM) {
      return isRunningOperation ? 'progress' : 'ready'
    }
    return 'idle'
  }

  const isClaim = operation === 'claim'
  const isDeposit = operation === 'deposit'

  return (
    <Modal onClose={closeModal}>
      <div className="flex w-96 flex-col gap-y-4">
        <Card padding="large">
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-base font-medium text-slate-950 lg:text-xl">
              {t('tunnel-page.review-deposit.heading')}
            </h4>
            <CloseIcon className="cursor-pointer" onClick={closeModal} />
          </div>
          <div className="flex items-center justify-between py-4">
            <span className="text-xs font-medium text-slate-500">
              {t('common.total-amount')}
            </span>
            <Amount token={token} value={foundDeposit.amount} />
          </div>
          <Step
            fees={isDeposit && fees}
            icon={<DepositIcon />}
            status={
              foundDeposit.status >= BtcDepositStatus.TX_CONFIRMED
                ? 'completed'
                : 'progress'
            }
            text={t('tunnel-page.review-deposit.initiate-deposit')}
          />
          <VerticalLine />
          <SubStep
            status={getWaitReadyToClaimStatus()}
            text={t('common.wait-hours', {
              hours: ExpectedClaimDepositTimeHours,
            })}
          />
          <VerticalLine />
          <Step
            fees={isClaim && fees}
            icon={<ClaimIcon />}
            status={getClaimStatus()}
            text={t('tunnel-page.review-deposit.claim-deposit')}
          />
          {![
            BtcDepositStatus.BTC_READY_CLAIM,
            BtcDepositStatus.BTC_DEPOSITED,
          ].includes(foundDeposit.status) && (
            <p className="mt-4 text-xs font-medium leading-snug text-slate-500">
              {t(
                'tunnel-page.review-deposit.btc-deposit-come-back-delay-note',
                {
                  hours: ExpectedClaimDepositTimeHours,
                },
              )}
            </p>
          )}
          {submitButton && (
            <form className="mt-6" onSubmit={handleSubmit}>
              {submitButton}
            </form>
          )}
        </Card>
        {transactionsList.length > 0 && (
          <div className="flex flex-col gap-y-4">
            {transactionsList.map(transaction => (
              <TransactionStatus
                explorerUrl={chain.blockExplorers.default.url}
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
