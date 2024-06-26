import Big from 'big.js'
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
      } font-semibold uppercase text-slate-700`}
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

const btcFeeBlocks = parseInt(process.env.NEXT_PUBLIC_BTC_FEE_BLOCKS)
const btcTxSize = parseInt(process.env.NEXT_PUBLIC_BTC_TX_SIZE)

export const SetMaxBtcBalance = function ({
  fromToken,
  isRunningOperation,
  onSetMaxBalance,
}: Props<BtcToken>) {
  const { balance, isLoading: isLoadingBalance } = useBtcBalance()

  const { fees, isLoading: isLoadingFees } = useEstimateBtcFees({
    feeBlocks: btcFeeBlocks,
    txSize: btcTxSize,
  })

  const btcBalance = balance?.confirmed ?? 0

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
