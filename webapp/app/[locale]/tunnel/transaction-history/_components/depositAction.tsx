import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import { DepositTunnelOperation } from 'types/tunnel'
import { getOperationFromDeposit } from 'utils/tunnel'

import { CallToAction } from './callToAction'

type Props = {
  deposit: DepositTunnelOperation
}

export const DepositAction = function ({ deposit }: Props) {
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.transaction-history.actions')

  const operation = getOperationFromDeposit(deposit)

  // All buttons show a "view" button, except for the ready to claim in bitcoin
  if (operation === 'claim') {
    return (
      <CallToAction
        networkType={networkType}
        text={t('claim')}
        txHash={deposit.transactionHash}
        variant="primary"
      />
    )
  }

  return (
    <CallToAction
      networkType={networkType}
      text={t('view')}
      txHash={deposit.transactionHash}
      variant="secondary"
    />
  )
}
