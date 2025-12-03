import { Row } from '@tanstack/react-table'
import { featureFlags } from 'app/featureFlags'
import { Button, ButtonIcon } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { Spinner } from 'components/spinner'
import { useTokenBalance } from 'hooks/useBalance'
import { useTranslations } from 'next-intl'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'
import { usePoolAsset } from '../_hooks/usePoolAsset'
import { type Vault } from '../_types'

import { Claim } from './claim'
import { Withdraw } from './withdraw'

const cssHoverChevron =
  'group-hover/chevron:[&>path]:fill-neutral-950 group-hover/chevron:[&>path]:transition-colors group-hover/chevron:[&>path]:duration-200'

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

  const commonProps = {
    size: 'xSmall',
    type: 'button',
  } as const

  const loadingStrategies = row.original.strategies === undefined

  return (
    <div className="flex w-full items-center justify-start gap-x-3 lg:justify-end">
      <div className="*:min-w-16.25">
        <Button
          {...commonProps}
          disabled={balance === undefined || balance === BigInt(0)}
          onClick={function (e) {
            // Prevent event bubbling to parent row
            e.stopPropagation()
            setOperationDrawer('deposit')
          }}
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
        <Withdraw />
      </div>
      {featureFlags.enableBtcYieldClaimRewards && (
        <div className="*:min-w-19">
          <Claim />
        </div>
      )}
      <div className="group/chevron">
        <ButtonIcon
          {...commonProps}
          disabled={loadingStrategies || !row.getCanExpand()}
          onClick={function (e) {
            // we need to stop propagation as otherwise the row handler will execute
            e.stopPropagation()
            row.toggleExpanded()
          }}
          variant="secondary"
        >
          {loadingStrategies ? (
            <Spinner color="#FF6C15" size="xSmall" />
          ) : row.getIsExpanded() ? (
            <Chevron.Up className={cssHoverChevron} />
          ) : (
            <Chevron.Bottom className={cssHoverChevron} />
          )}
        </ButtonIcon>
      </div>
    </div>
  )
}
