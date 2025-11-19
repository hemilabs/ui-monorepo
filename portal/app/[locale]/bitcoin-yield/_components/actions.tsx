import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { useTokenBalance } from 'hooks/useBalance'
import { useTranslations } from 'next-intl'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'
import { usePoolAsset } from '../_hooks/usePoolAsset'
import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'

export const Actions = function () {
  const t = useTranslations()
  const [, setOperationDrawer] = useOperationDrawer()
  const token = usePoolAsset().data

  const {
    balance,
    // I need to use this because useTokenBalance is defaulting to zero
    // TODO https://github.com/hemilabs/ui-monorepo/issues/1648
    isLoading: isTokenBalanceLoading,
  } = useTokenBalance(token.chainId, token.address)
  const { data: poolBalance, isError: isPoolBalanceError } =
    useUserPoolBalance()

  const commonProps = {
    size: 'xSmall',
    type: 'button',
  } as const

  const poolBalanceLoading = poolBalance === undefined && !isPoolBalanceError

  return (
    <div className="flex items-center gap-x-3 [&>button]:min-w-16">
      <Button
        {...commonProps}
        disabled={balance === undefined || balance === BigInt(0)}
        onClick={() => setOperationDrawer('deposit')}
        variant="primary"
      >
        {isTokenBalanceLoading ? (
          <Spinner size="xSmall" />
        ) : (
          t('common.deposit')
        )}
      </Button>
      <Button
        {...commonProps}
        disabled={poolBalance === undefined || poolBalance === BigInt(0)}
        onClick={() => setOperationDrawer('withdraw')}
        variant="secondary"
      >
        {poolBalanceLoading ? (
          <Spinner color="#FF6C15" size="xSmall" />
        ) : (
          t('common.withdraw')
        )}
      </Button>
      <Button {...commonProps} variant="secondary">
        {t('bitcoin-yield.table.claim-rewards')}
      </Button>
    </div>
  )
}
