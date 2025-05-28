import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useTranslations } from 'next-intl'
import { EvmToken } from 'types/token'
import { tunnelsThroughPartners } from 'utils/token'

type Props = {
  canDeposit: boolean
  fromToken: EvmToken
  isAllowanceLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  operationRunning: 'idle' | 'approving' | 'depositing'
  setIsPartnersDrawerOpen: (isOpen: boolean) => void
  validationError: string | undefined
}
export const SubmitEvmDeposit = function ({
  canDeposit,
  fromToken,
  isAllowanceLoading,
  isRunningOperation,
  needsApproval,
  operationRunning,
  setIsPartnersDrawerOpen,
  validationError,
}: Props) {
  const t = useTranslations()

  if (tunnelsThroughPartners(fromToken)) {
    return (
      <Button onClick={() => setIsPartnersDrawerOpen(true)} type="button">
        {t('tunnel-page.tunnel-partners.tunnel-with-our-partners')}
      </Button>
    )
  }

  const getOperationButtonText = function () {
    const texts = {
      approve: {
        idle: t('tunnel-page.submit-button.approve-and-deposit'),
        loading: t('tunnel-page.submit-button.approving'),
      },
      deposit: {
        idle: t('tunnel-page.submit-button.deposit'),
        loading: t('tunnel-page.submit-button.depositing'),
      },
    }
    if (isAllowanceLoading) {
      return <Spinner size={'small'} />
    }
    if (operationRunning === 'approving') {
      return texts.approve.loading
    }
    if (operationRunning === 'depositing') {
      return texts.deposit.loading
    }
    if (validationError) {
      return validationError
    }
    // TODO Se need to handle allowanceStatus === 'error, see https://github.com/hemilabs/ui-monorepo/pull/1125
    return texts[needsApproval ? 'approve' : 'deposit'].idle
  }

  return (
    <SubmitWhenConnectedToChain
      chainId={fromToken.chainId}
      submitButton={
        <Button
          disabled={!canDeposit || isRunningOperation || isAllowanceLoading}
          type="submit"
        >
          {getOperationButtonText()}
        </Button>
      }
    />
  )
}
