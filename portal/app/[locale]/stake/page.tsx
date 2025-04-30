'use client'

import { useTokenPrices } from 'hooks/useTokenPrices'
import { sortTokens } from 'utils/sortTokens'

import { StakeGraph } from './_components/icons/stakeGraph'
import { StakeAndEarn } from './_components/stakeAndEarn'
import { StakeStrategyTable } from './_components/stakeStrategyTable'
import { useWalletBalances } from './_hooks/useWalletBalances'

const PageBackground = () => (
  <>
    <div
      className="absolute inset-0 -z-10"
      style={{
        background:
          'radial-gradient(100% 100% at 50% 0%, rgba(253, 239, 232, 0.16) 11.7%, rgba(255, 111, 26, 0.16) 37.02%, rgba(255, 24, 20, 0.03) 60.34%), #FAFAFA',
      }}
    ></div>

    <div className="relative flex w-full flex-col items-center justify-between lg:flex-row lg:items-start">
      <div className="[&>div>svg]:-translate-x-36 [&>div>svg]:-translate-y-2 [&>div>svg]:scale-75 lg:[&>div>svg]:-translate-x-8">
        <StakeAndEarn />
      </div>
      <div className="[&>svg]:lg:scale-80 [&>svg]:lg:-translate-y-25 [&>svg]:-translate-y-20 [&>svg]:scale-75 [&>svg]:lg:translate-x-12 [&>svg]:xl:translate-x-16">
        <StakeGraph />
      </div>
    </div>
  </>
)

export default function Page() {
  // Removing WETH from the list of tokens to stake
  // here instead of in the tokenList file
  // It has to be rendered on dashboard page though
  const { loading: isLoadingBalance, tokensWalletBalance } = useWalletBalances()
  const tokensFiltered = tokensWalletBalance.filter(t => t.symbol !== 'WETH')

  const { data: prices, isPending: isLoadingPrices } = useTokenPrices()
  const isLoading = isLoadingBalance || isLoadingPrices
  const sortedTokens = isLoading ? [] : sortTokens(tokensFiltered, prices)

  return (
    <div className="h-[calc(100vh-theme(spacing.48))]">
      <PageBackground />
      <div className="relative z-20 -translate-y-60 md:-translate-y-48">
        <StakeStrategyTable data={sortedTokens} loading={isLoading} />
      </div>
    </div>
  )
}
