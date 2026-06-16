import { RenderFiatBalance } from 'components/fiatBalance'
import { type ComponentProps } from 'react'

import { useEarnTokenPrices } from '../_hooks/useEarnTokenPrices'

// Hemi Earn's counterpart to `components/fiatBalance`'s `RenderFiatBalance`: the
// same component priced through `useEarnTokenPrices` (portal feed + gateway
// oracle prices) instead of the plain portal feed, so pegged tokens (vetBTC,
// VUSD) resolve via their whitelisted-proxy `priceSymbol`. A thin wrapper so the
// shared `RenderFiatBalance` (and its ErrorBoundary) stays the single source of
// the rendering, defaulting the rest of the app to the portal feed.
export const RenderEarnFiatBalance = (
  props: Omit<ComponentProps<typeof RenderFiatBalance>, 'usePrices'>,
) => <RenderFiatBalance {...props} usePrices={useEarnTokenPrices} />
