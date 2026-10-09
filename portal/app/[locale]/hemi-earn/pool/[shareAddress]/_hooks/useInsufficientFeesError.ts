import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useTranslations } from 'use-intl'
import { getNativeToken } from 'utils/nativeToken'
import { type Chain } from 'viem'

import { resolveInsufficientFeesError } from '../_utils/formState'

export const useInsufficientFeesError = function ({
  chainId,
  totalFees,
}: {
  chainId: Chain['id']
  totalFees: bigint | undefined
}) {
  const t = useTranslations('common')
  const { data: nativeTokenBalance } = useNativeBalance(chainId)

  return resolveInsufficientFeesError({
    insufficientFeesMessage: t('insufficient-balance', {
      symbol: getNativeToken(chainId).symbol,
    }),
    nativeBalance: nativeTokenBalance?.value,
    totalFees,
  })
}
