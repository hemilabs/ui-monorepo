import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { useTranslations } from 'next-intl'
import { orange600 } from 'styles'
import { useAccount } from 'wagmi'

import { useHasClaimableRewards } from '../_hooks/useHasClaimableRewards'
import { useOperationDrawer } from '../_hooks/useOperationDrawer'

export const Claim = function () {
  const { address } = useAccount()
  const [, setOperationDrawer] = useOperationDrawer()
  const t = useTranslations()

  const { data: hasClaimableRewards, isError: isHasClaimableRewardsError } =
    useHasClaimableRewards()

  return (
    <Button
      disabled={!address || isHasClaimableRewardsError || !hasClaimableRewards}
      onClick={function (e) {
        // Prevent event bubbling to parent row
        e.stopPropagation()
        setOperationDrawer('claim')
      }}
      size="xSmall"
      type="button"
      variant="secondary"
    >
      {hasClaimableRewards !== undefined || !address ? (
        t('bitcoin-yield.table.claim-rewards')
      ) : (
        <Spinner color={orange600} size="xSmall" />
      )}
    </Button>
  )
}
