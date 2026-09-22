import { WalletClaimable } from './walletClaimable'
import { WalletStaked } from './walletStaked'

export const WalletStatsSection = () => (
  <section className="mt-8 grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 [&>.card-container]:min-w-0">
    <WalletStaked />
    <WalletClaimable />
  </section>
)
