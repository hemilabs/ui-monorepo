import { Row } from '@tanstack/react-table'
import { Button, ButtonIcon } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { Spinner } from 'components/spinner'
import { useTokenBalance } from 'hooks/useBalance'
import { useTranslations } from 'next-intl'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'
import { usePoolAsset } from '../_hooks/usePoolAsset'
import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'
import { type Vault } from '../_types'

import { Claim } from './claim'

type Props = {
  row: Row<Vault>
}

export const Actions = function ({ row }: Props) {
  const [, setOperationDrawer] = useOperationDrawer()
  const token = usePoolAsset().data
  const t = useTranslations()

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

  const loadingStrategies = row.original.strategies === undefined

  return (
    <div className="flex w-full items-center justify-start gap-x-3 lg:justify-end">
      <div className="*:min-w-16.25">
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
      </div>
      <div className="*:min-w-19">
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
      </div>
      <div className="*:min-w-19">
        <Claim />
      </div>
      <ButtonIcon
        {...commonProps}
        disabled={loadingStrategies || !row.getCanExpand()}
        onClick={row.getToggleExpandedHandler()}
        variant="secondary"
      >
        {loadingStrategies ? (
          <Spinner color="#FF6C15" size="xSmall" />
        ) : row.getIsExpanded() ? (
          <Chevron.Up />
        ) : (
          <Chevron.Bottom />
        )}
      </ButtonIcon>
    </div>
  )
}
