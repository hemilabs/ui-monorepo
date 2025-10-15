'use client'

import { PageLayout } from 'components/pageLayout'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { priorityStakeTokensToSort } from 'types/stake'
import { sortTokens } from 'utils/sortTokens'

import { StakeStrategyTable } from './_components/stakeStrategyTable'
import { useWalletBalances } from './_hooks/useWalletBalances'

export default function Page() {
  const t = useTranslations('stake-page')
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
            tokens: tokensWalletBalance.filter(f => f && f.symbol !== 'WETH'),
          })
        : [],
    [errorUpdateCount, isLoading, prices, tokensWalletBalance],
  )

  return (
    <PageLayout variant="wide">
      <div className="h-fit-rest-screen w-full pb-4 md:pb-0">
        <h1 className="text-2xl font-semibold text-neutral-950">
          {t('stake.stake-earn-points')}
        </h1>
        <div className="mt-6 md:mt-8">
          <StakeStrategyTable data={sortedTokens} loading={isLoading} />
        </div>
      </div>
    </PageLayout>
  )
}
