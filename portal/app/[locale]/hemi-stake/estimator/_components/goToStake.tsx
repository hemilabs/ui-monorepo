import { Button, ButtonLink } from 'components/button'
import { LazyConnectEvmWallet } from 'components/lazyConnectEvmWallet'
import { useTokenBalance } from 'hooks/useBalance'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'use-intl'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { minLockAmount } from 've-hemi-actions'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { getLockupErrorMessage } from '../../_utils/lockupError'
import { useEstimator } from '../_context/estimatorContext'

export const GoToStake = function () {
  const { amount, lockupDays } = useEstimator()
  const t = useTranslations()
  const token = useHemiToken()
  const { status } = useAccount()
  const {
    data: balance,
    isError,
    isPending,
  } = useTokenBalance(token.chainId, token.address)

  const label = t('hemi-stake.estimator.stake-this-amount')

  if (!walletIsConnected(status)) {
    return (
      <LazyConnectEvmWallet
        buttonSize="xLarge"
        text={t('common.connect-wallet')}
      />
    )
  }

  const { canSubmit, error } = validateSubmit({
    amountInput: amount,
    balance: isError ? parseTokenUnits(amount, token) : balance,
    minAmount: formatUnits(minLockAmount, token.decimals),
    operation: 'stake',
    t,
    token,
  })
  const lockupError = getLockupErrorMessage({ value: lockupDays })

  if (!isPending && canSubmit && !lockupError) {
    return (
      <ButtonLink
        href={{ pathname: '/hemi-stake', query: { amount, lockupDays } }}
        size="xLarge"
      >
        {label}
      </ButtonLink>
    )
  }

  const reason = isPending
    ? undefined
    : (error ?? (lockupError && t(lockupError.key, lockupError.values)))

  return (
    <Button disabled size="xLarge">
      {reason ?? label}
    </Button>
  )
}
