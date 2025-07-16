import { DisplayAmount } from 'components/displayAmount'
import { useBitcoin } from 'hooks/useBitcoin'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { getNativeToken } from 'utils/nativeToken'

export const BtcFees = function () {
  const bitcoin = useBitcoin()
  const {
    feePrices,
    isError: isFeePricesError,
    isLoading: isLoadingFeePrices,
  } = useGetFeePrices()
  const t = useTranslations('common')

  const token = getNativeToken(bitcoin.id)
  const fees = feePrices?.fastestFee?.toString()

  const render = function () {
    if (isFeePricesError) {
      return <span>-</span>
    }
    if (isLoadingFeePrices) {
      return <Skeleton className="h-4 w-12" />
    }

    return (
      <DisplayAmount
        amount={fees}
        showTokenLogo={false}
        // Btc fees are displayed in the special unit
        token={{
          ...token,
          symbol: 'sat/vB',
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-y-1 px-8 py-4 text-sm md:px-10">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{t('fees')}</span>
        <div className="text-neutral-950">{render()}</div>
      </div>
    </div>
  )
}
