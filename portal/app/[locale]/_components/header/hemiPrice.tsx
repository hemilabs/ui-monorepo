import { TokenPricePill } from 'components/tokenPricePill'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useUmami } from 'hooks/useUmami'
import { isDataUnavailable } from 'utils/queryStatus'
import { getTokenPrice } from 'utils/token'

const hemiPriceUrl = 'https://coinmarketcap.com/currencies/hemi/'

export const HemiPrice = function () {
  const { data: prices, fetchStatus, isLoading, status } = useTokenPrices()
  const token = useHemiToken()
  const { enabled, track } = useUmami()

  const quoted = getTokenPrice(token, prices)
  const price = quoted === '0' ? undefined : quoted

  if (isDataUnavailable({ fetchStatus, status })) {
    return null
  }
  if (price === undefined && !isLoading) {
    return null
  }

  return (
    <TokenPricePill
      href={hemiPriceUrl}
      isLoading={isLoading}
      onClick={enabled ? () => track('header - hemi price') : undefined}
      price={price}
      token={token}
    />
  )
}
