import Big from 'big.js'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

type Props = {
  fromToken: Token
  isRunningOperation: boolean
  onSetMaxBalance: (maxBalance: string) => void
}
export const SetMaxBalance = function ({
  fromToken,
  isRunningOperation,
  onSetMaxBalance,
}: Props) {
  const t = useTranslations('tunnel-page.form')

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !isNativeToken(fromToken),
  )

  const fromTokenBalanceInWallet = formatUnits(
    isNativeToken(fromToken) ? walletNativeTokenBalance : walletTokenBalance,
    fromToken.decimals,
  )

  const handleClick = () => onSetMaxBalance(fromTokenBalanceInWallet)

  const disabled = isRunningOperation || Big(fromTokenBalanceInWallet).eq(0)

  return (
    <button
      className="cursor-pointer font-semibold uppercase text-slate-700"
      disabled={disabled}
      onClick={handleClick}
      type="button"
    >
      {t('max')}
    </button>
  )
}
