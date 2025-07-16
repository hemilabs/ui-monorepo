import { DisplayAmount } from 'components/displayAmount'
import { useBitcoin } from 'hooks/useBitcoin'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

import { useBtcDepositTunnelFees } from '../_hooks/useBtcTunnelFees'

type BtcFeesProps = {
  amount: bigint
}

// Local components for consistent UI states
const FallbackState = () => <span>-</span>

const FeeLoadingState = () => <Skeleton className="h-4 w-12" />

export const BtcFees = function ({ amount }: BtcFeesProps) {
  const bitcoin = useBitcoin()
  const {
    feePrices,
    isError: isFeePricesError,
    isLoading: isLoadingFeePrices,
  } = useGetFeePrices()
  const {
    btcDepositFee,
    isError: isTunnelFeeError,
    isLoading: isLoadingTunnelFee,
  } = useBtcDepositTunnelFees(amount)
  const t = useTranslations('common')

  const nativeToken = getNativeToken(bitcoin.id)

  const renderNetworkFees = function () {
    const networkFees = feePrices?.fastestFee?.toString()

    if (isFeePricesError) {
      return <FallbackState />
    }
    if (isLoadingFeePrices) {
      return <FeeLoadingState />
    }
    if (networkFees === undefined) {
      return <FallbackState />
    }

    return (
      <DisplayAmount
        amount={networkFees}
        showTokenLogo={false}
        token={{
          ...nativeToken,
          symbol: 'sat/vB',
        }}
      />
    )
  }

  const renderTunnelFees = function () {
    if (isTunnelFeeError) {
      return <FallbackState />
    }
    if (isLoadingTunnelFee) {
      return <FeeLoadingState />
    }
    if (btcDepositFee === undefined) {
      return <FallbackState />
    }

    return (
      <DisplayAmount
        amount={formatUnits(BigInt(btcDepositFee), nativeToken.decimals)}
        showTokenLogo={false}
        token={nativeToken}
      />
    )
  }

  return (
    <div className="flex flex-col gap-y-1 px-8 py-4 text-sm md:px-10">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{t('network-fees')}</span>
        <div className="text-neutral-950">{renderNetworkFees()}</div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{t('tunnel-fees')}</span>
        <div className="text-neutral-950">{renderTunnelFees()}</div>
      </div>
    </div>
  )
}
