import { RenderFiatBalance } from 'components/fiatBalance'
import { type ComponentProps } from 'react'

import { useEarnTokenPrices } from '../_hooks/useEarnTokenPrices'

// RenderFiatBalance priced through useEarnTokenPrices so pegged tokens (vetBTC, VUSD)
// resolve via their priceSymbol; the rest of the app keeps the plain portal feed.
export const RenderEarnFiatBalance = (
  props: Omit<ComponentProps<typeof RenderFiatBalance>, 'usePrices'>,
) => <RenderFiatBalance {...props} usePrices={useEarnTokenPrices} />
