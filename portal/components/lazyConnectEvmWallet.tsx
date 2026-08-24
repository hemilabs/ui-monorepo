import { ButtonLoader } from 'components/buttonLoader'
import { lazyWithFallback } from 'components/lazyWithFallback'

export const LazyConnectEvmWallet = lazyWithFallback(
  () =>
    import('components/connectEvmWallet').then(mod => ({
      default: mod.ConnectEvmWallet,
    })),
  <ButtonLoader />,
)
