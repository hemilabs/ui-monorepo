import Big from 'big.js'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
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
      className="cursor-pointer font-semibold text-slate-700"
      disabled={disabled}
      onClick={handleClick}
      type="button"
    >
      MAX
    </button>
  )
}
