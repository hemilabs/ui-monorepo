import { DisplayAmount } from 'components/displayAmount'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { formatUnits } from 'viem'

import { useBtcWithdrawalTunnelFees } from '../_hooks/useBtcTunnelFees'

const FallbackState = () => <span>-</span>

type Props = {
  amount: bigint
  token: EvmToken
}

export const HemiBtcFeesSummary = function ({ amount, token }: Props) {
  const {
    btcWithdrawalFee,
    isError: isTunnelFeeError,
    isLoading: isLoadingTunnelFee,
  } = useBtcWithdrawalTunnelFees(amount)
  const t = useTranslations('common')

  const renderTunnelFees = function () {
    if (isLoadingTunnelFee) {
      return <Skeleton className="w-12" />
    }

    if (isTunnelFeeError || btcWithdrawalFee === undefined) {
      return <FallbackState />
    }

    return (
      <DisplayAmount
        amount={formatUnits(BigInt(btcWithdrawalFee), token.decimals)}
        showTokenLogo={false}
        token={token}
      />
    )
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{t('tunnel-fees')}</span>
      <div className="text-neutral-950">{renderTunnelFees()}</div>
    </div>
  )
}
