import Big from 'big.js'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useBitcoinBalance } from 'hooks/useBitcoinBalance'
import { useEstimateBtcFees } from 'hooks/useEstimateBtcFees'
import { useTranslations } from 'next-intl'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

export const MaxButton = function ({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: VoidFunction | undefined
}) {
  const t = useTranslations('tunnel-page.form')
  return (
    <button
      className={`${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } hoverable-text text-sm font-medium uppercase`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {t('max')}
    </button>
  )
}

type Props<T extends Token = Token> = {
  disabled: boolean
  onSetMaxBalance: (maxBalance: string) => void
  token: T
}

export const SetMaxEvmBalance = function ({
  disabled,
  gas,
  onSetMaxBalance,
  token,
}: Props<EvmToken> & { gas: bigint }) {
  const {
    data: walletNativeTokenBalance,
    isLoading: isLoadingNativeTokenBalance,
  } = useNativeTokenBalance(token.chainId)

  const { data: walletTokenBalance } = useTokenBalance(
    token.chainId,
    token.address,
  )

  // gas is paid in native token. So we must deduct gas for native tokens, but not for erc20 tokens
  const finalBalance = isNativeToken(token)
    ? (walletNativeTokenBalance?.value ?? BigInt(0)) - gas
    : walletTokenBalance

  const maxBalance = formatUnits(finalBalance ?? BigInt(0), token.decimals)

  const handleClick = () => onSetMaxBalance(maxBalance)

  const maxButtonDisabled =
    disabled || isLoadingNativeTokenBalance || Big(maxBalance).lte(0)

  return <MaxButton disabled={maxButtonDisabled} onClick={handleClick} />
}

export const SetMaxBtcBalance = function ({
  disabled,
  onSetMaxBalance,
  token,
}: Props<BtcToken>) {
  const { address } = useBtcAccount()
  const { balance, isLoading: isLoadingBalance } = useBitcoinBalance()
  const btcBalance = balance?.confirmed ?? 0

  const { fees, isLoading: isLoadingFees } = useEstimateBtcFees(address)

  const maxButtonDisabled =
    disabled ||
    isLoadingBalance ||
    isLoadingFees ||
    btcBalance === 0 ||
    fees === undefined ||
    btcBalance <= fees

  const handleClick = () =>
    onSetMaxBalance(formatUnits(BigInt(btcBalance - fees!), token.decimals))

  return (
    <MaxButton
      disabled={maxButtonDisabled}
      onClick={maxButtonDisabled ? undefined : handleClick}
    />
  )
}
