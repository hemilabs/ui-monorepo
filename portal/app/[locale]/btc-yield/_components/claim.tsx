import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { orange600 } from 'styles'
import { useAccount } from 'wagmi'

import { useHasClaimableRewards } from '../_hooks/useHasClaimableRewards'
import { useOperationDrawer } from '../_hooks/useOperationDrawer'
import { opportunityId } from '../_utils'

export const Claim = function () {
  const { address } = useAccount()
  const hemi = useHemi()
  const [, setOperationDrawer] = useOperationDrawer()
  const t = useTranslations()

  const { data: hasClaimableRewards, isError: isHasClaimableRewardsError } =
    useHasClaimableRewards()

  const isDisabled =
    !address ||
    isHasClaimableRewardsError ||
    !hasClaimableRewards ||
    hemi.testnet

  return (
    <Button
      disabled={isDisabled}
      onClick={function (e) {
        // Prevent event bubbling to parent row
        e.stopPropagation()
        setOperationDrawer('claim')
      }}
      size="xSmall"
      type="button"
      variant="secondary"
    >
      {opportunityId === undefined ||
      hasClaimableRewards !== undefined ||
      !address ? (
        t('bitcoin-yield.table.claim-rewards')
      ) : (
        <Spinner color={orange600} size="xSmall" />
      )}
    </Button>
  )
}
