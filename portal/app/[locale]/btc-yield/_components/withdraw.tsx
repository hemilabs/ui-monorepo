import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { useTranslations } from 'next-intl'
import { orange600 } from 'styles'
import { useAccount } from 'wagmi'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'
import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'

export const Withdraw = function () {
  const { address } = useAccount()
  const [, setOperationDrawer] = useOperationDrawer()
  const t = useTranslations()
  const { data: poolBalance, isError: isPoolBalanceError } =
    useUserPoolBalance()

  const isWithdrawDisabled =
    !address || poolBalance === undefined || poolBalance === BigInt(0)
  const poolBalanceLoading = poolBalance === undefined && !isPoolBalanceError

  return (
    <Button
      disabled={isWithdrawDisabled}
      onClick={function (e) {
        // Prevent event bubbling to parent row
        e.stopPropagation()
        setOperationDrawer('withdraw')
      }}
      size="xSmall"
      type="button"
      variant="secondary"
    >
      {poolBalanceLoading && !!address ? (
        <Spinner color={orange600} size="xSmall" />
      ) : (
        t('common.withdraw')
      )}
    </Button>
  )
}
