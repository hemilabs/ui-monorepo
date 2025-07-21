'use client'

import { PageLayout } from 'components/pageLayout'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useMemo } from 'react'
import { priorityStakeTokensToSort } from 'types/stake'
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
    />

    <div className="relative flex w-full flex-col items-center justify-between lg:flex-row lg:items-start">
      <div
        className="flex w-full items-center justify-center 
    [&>div>svg]:scale-75 [&>div>svg]:lg:-translate-x-8 [&>div>svg]:lg:-translate-y-2"
      >
        <StakeAndEarn />
      </div>
      <div className="[&>svg]:lg:scale-80 [&>svg]:lg:-translate-y-25 [&>svg]:-translate-y-20 [&>svg]:scale-75 [&>svg]:lg:translate-x-12 [&>svg]:xl:translate-x-16">
        <StakeGraph />
      </div>
    </div>
  </>
)

export default function Page() {
  const { loading: isLoadingBalance, tokensWalletBalance } = useWalletBalances()

  const {
    data: prices,
    errorUpdateCount,
    isPending: isLoadingPrices,
  } = useTokenPrices()

  const isLoading = isLoadingBalance || isLoadingPrices

  const sortedTokens = useMemo(
    () =>
      // If prices errored, let's show the tokens without price ordering.
      // If the prices API eventually comes back, prices will be redefined and they will
      // be sorted as expected.
      !isLoading || errorUpdateCount > 0
        ? sortTokens({
            // Removing WETH from the list of tokens to stake
            // here instead of in the tokenList file
            // It has to be rendered on dashboard page though
            prices,
            prioritySymbols: priorityStakeTokensToSort,
            tokens: tokensWalletBalance.filter(t => t && t.symbol !== 'WETH'),
          })
        : [],
    [errorUpdateCount, isLoading, prices, tokensWalletBalance],
  )

  return (
    <PageLayout variant="wide">
      <div className="h-[calc(100vh-theme(spacing.48))]">
        <PageBackground />
        <div className="relative z-20 -translate-y-60 md:-translate-y-48">
          <StakeStrategyTable data={sortedTokens} loading={isLoading} />
        </div>
      </div>
    </PageLayout>
  )
}
