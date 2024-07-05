import { bitcoin } from 'app/networks'
import { TransactionStatus } from 'components/transactionStatus'
import { BtcDepositStatus } from 'context/tunnelHistoryContext/types'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { Card } from 'ui-common/components/card'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { Modal } from 'ui-common/components/modal'

import { useBtcDeposits } from '../../_hooks/useBtcDeposits'
import { useTunnelOperation } from '../../_hooks/useTunnelOperation'

import { Amount } from './amount'
import { Step } from './steps'

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
  fees?: {
    amount: string
    symbol: string
  }
  isRunningOperation: boolean
  onClose?: () => void
  token: Token
  transactionsList?: {
    id: string
    status: React.ComponentProps<typeof TransactionStatus>['status']
    text: string
    txHash: string
  }[]
}

export const ReviewBtcDeposit = function ({
  fees,
  isRunningOperation,
  onClose,
  token,
  transactionsList,
}: ReviewBtcDeposit) {
  const deposits = useBtcDeposits()
  const router = useRouter()
  const t = useTranslations()
  const { txHash } = useTunnelOperation()

  const foundDeposit = deposits.find(
    deposit => deposit.transactionHash === txHash,
  )

  const closeModal = function () {
    // prevent closing if running an operation
    if (isRunningOperation) {
      return
    }
    onClose?.()
    router.back()
  }

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
            fees={fees}
            icon={<DepositIcon />}
            status={
              foundDeposit.status >= BtcDepositStatus.TX_CONFIRMED
                ? 'completed'
                : 'progress'
            }
            text={t('tunnel-page.review-deposit.initiate-deposit')}
          />
          {/* TODO enable force claim https://github.com/BVM-priv/ui-monorepo/issues/346 */}
          <p className="mt-4 text-xs font-medium leading-snug text-slate-500">
            {t('tunnel-page.review-deposit.btc-deposit-come-back-delay-note')}
          </p>
        </Card>
        {transactionsList.length > 0 && (
          <div className="flex flex-col gap-y-4">
            {transactionsList.map(transaction => (
              <TransactionStatus
                explorerUrl={bitcoin.blockExplorers.default.url}
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
