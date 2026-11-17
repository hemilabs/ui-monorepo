import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { Button, ButtonSize } from 'components/button'
import { ReactNode } from 'react'
import { RemoteChain } from 'types/chain'
import { EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { getNativeToken } from 'utils/nativeToken'

type Props = {
  chainId: RemoteChain['id']
  submitButton: ReactNode
  submitButtonSize?: ButtonSize
}

export const SubmitWhenNativeBalance = function ({
  chainId,
  submitButton,
  submitButtonSize = 'xLarge',
}: Props) {
  const t = useTranslations()
  const { data: nativeBalance } = useNativeBalance(chainId)

  // Only an exact zero blocks: fees are estimates, and while the read is in
  // flight or has failed the form stays usable.
  if (nativeBalance?.value === BigInt(0)) {
    const { symbol } = getNativeToken(chainId) as EvmToken
    return (
      <Button disabled size={submitButtonSize} type="submit">
        {t('common.insufficient-balance', { symbol })}
      </Button>
    )
  }

  return <>{submitButton}</>
}
