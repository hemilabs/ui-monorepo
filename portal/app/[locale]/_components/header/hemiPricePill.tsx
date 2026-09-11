import { ErrorBoundary } from 'components/errorBoundary'
import { TokenPricePill } from 'components/tokenPricePill'
import { useHemiToken } from 'hooks/useHemiToken'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useUmami } from 'hooks/useUmami'
import { Suspense } from 'react'
import { getTokenPrice } from 'utils/token'

const hemiPriceUrl = 'https://coinmarketcap.com/currencies/hemi/'

const Price = function () {
  const { data: prices, isLoading } = useTokenPrices()
  const token = useHemiToken()
  const { enabled, track } = useUmami()

  // getTokenPrice answers '0' for a symbol the feed has no entry for, and that
  // would render as $0.00 instead of hiding the pill
  const quoted = getTokenPrice(token, prices)
  const price = quoted === '0' ? undefined : quoted

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

const HemiPricePillImpl = function () {
  const [networkType] = useNetworkType()

  if (networkType === 'testnet') {
    return null
  }

  return <Price />
}

// The header renders outside the app's error boundary, so anything thrown here
// blanks every route. The fragment is deliberate: ErrorBoundary falls back to
// GenericError on a nullish fallback, and a header is no place for an error card
export const HemiPricePill = () => (
  <ErrorBoundary fallback={<></>}>
    <Suspense fallback={null}>
      <HemiPricePillImpl />
    </Suspense>
  </ErrorBoundary>
)
