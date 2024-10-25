import Big from 'big.js'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useEstimateBtcFees } from 'hooks/useEstimateBtcFees'
import { useTranslations } from 'next-intl'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

const MaxButton = function ({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  const t = useTranslations('tunnel-page.form')
  return (
    <button
      className={`${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } text-sm font-medium uppercase text-orange-500 hover:text-orange-700`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {t('max')}
    </button>
  )
}

type Props<T extends Token = Token> = {
  fromToken: T
  isRunningOperation: boolean
  onSetMaxBalance: (maxBalance: string) => void
}

export const SetMaxEvmBalance = function ({
  fromToken,
  gas,
  isRunningOperation,
  onSetMaxBalance,
}: Props<EvmToken> & { gas: bigint }) {
  const {
    balance: walletNativeTokenBalance,
    isLoading: isLoadingNativeTokenBalance,
  } = useNativeTokenBalance(fromToken.chainId)

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !isNativeToken(fromToken),
  )

  // gas is paid in native token. So we must deduct gas for native tokens, but not for erc20 tokens
  const finalBalance = isNativeToken(fromToken)
    ? walletNativeTokenBalance - gas
    : walletTokenBalance

  const maxBalance = formatUnits(finalBalance, fromToken.decimals)

  const handleClick = () => onSetMaxBalance(maxBalance)

  const disabled =
    isLoadingNativeTokenBalance || isRunningOperation || Big(maxBalance).lte(0)

  return <MaxButton disabled={disabled} onClick={handleClick} />
}

export const SetMaxBtcBalance = function ({
  fromToken,
  isRunningOperation,
  onSetMaxBalance,
}: Props<BtcToken>) {
  const { address } = useBtcAccount()
  const { balance, isLoading: isLoadingBalance } = useBtcBalance()
  const btcBalance = balance?.confirmed ?? 0

  const { fees, isLoading: isLoadingFees } = useEstimateBtcFees(address)

  const disabled =
    isRunningOperation ||
    isLoadingBalance ||
    isLoadingFees ||
    btcBalance === 0 ||
    btcBalance <= fees

  const handleClick = () =>
    onSetMaxBalance(formatUnits(BigInt(btcBalance - fees), fromToken.decimals))

  return <MaxButton disabled={disabled} onClick={handleClick} />
}
