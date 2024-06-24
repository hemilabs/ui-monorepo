import Big from 'big.js'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useTranslations } from 'next-intl'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { isEvmToken, isNativeToken } from 'utils/token'
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
      className="cursor-pointer font-semibold uppercase text-slate-700"
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

const SetMaxEvmBalance = function ({
  fromToken,
  isRunningOperation,
  onSetMaxBalance,
}: Props<EvmToken>) {
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

  return <MaxButton disabled={disabled} onClick={handleClick} />
}

const SetMaxBtcBalance = function ({
  fromToken,
  isRunningOperation,
  onSetMaxBalance,
}: Props<BtcToken>) {
  const { balance } = useBtcBalance()
  const disabled = isRunningOperation || (balance?.confirmed ?? 0) === 0

  const handleClick = () =>
    onSetMaxBalance(formatUnits(BigInt(balance!.confirmed), fromToken.decimals))

  return (
    <MaxButton
      disabled={disabled}
      // TODO we must account for btc fees https://github.com/BVM-priv/ui-monorepo/issues/342
      onClick={handleClick}
    />
  )
}

export const SetMaxBalance = ({ fromToken, ...props }: Props) =>
  isEvmToken(fromToken) ? (
    <SetMaxEvmBalance {...props} fromToken={fromToken} />
  ) : (
    <SetMaxBtcBalance {...props} fromToken={fromToken} />
  )
