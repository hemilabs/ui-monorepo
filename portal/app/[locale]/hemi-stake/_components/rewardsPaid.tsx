import Big from 'big.js'
import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { type Token } from 'types/token'
import { useLocale, useTranslations } from 'use-intl'
import {
  formatCompactFiat,
  formatCompactFiatParts,
  formatFiatNumber,
} from 'utils/format'
import { isDataUnavailable } from 'utils/queryStatus'
import { getTokenByAddress, getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'

import { type StakeStats } from '../_fetchers/fetchStakeStats'
import { useStakeStats } from '../_hooks/useStakeStats'

import { StakeStatCard, StatValueSkeleton } from './stakeStatCard'
import { StatBadge } from './statBadge'

const selectRewards = (stats: StakeStats) => stats.rewards

type RewardRowProps = {
  amount: string
  token: Token
  usd: number
}

const RewardRow = ({ amount, token, usd }: RewardRowProps) => (
  <div className="flex items-center gap-x-1 sm:min-w-52">
    <TokenLogo size="small" token={token} />
    <span className="mr-auto text-sm font-medium text-white">
      {token.symbol}
    </span>
    <span className="text-sm font-medium text-white">
      ${formatFiatNumber(usd)}
    </span>
    <span className="text-sm font-medium text-neutral-400">({amount})</span>
  </div>
)

export const RewardsPaid = function () {
  const locale = useLocale()
  const { data: prices, isError: isPricesError } = useTokenPrices()
  const t = useTranslations('hemi-stake.stats')
  const { data, fetchStatus, isPending, status } = useStakeStats(selectRewards)

  const isUnavailable =
    isDataUnavailable({ fetchStatus, status }) ||
    (data !== undefined && data.length === 0)

  const paid = (data ?? []).flatMap(function ({ address, amount, chainId }) {
    const token = getTokenByAddress(address, chainId)
    if (!token) {
      return []
    }
    const value = formatUnits(BigInt(amount), token.decimals)
    const { number, suffix } = formatCompactFiatParts(Number(value), locale)
    return [
      {
        amount: `${number}${suffix}`,
        token,
        usd: Big(value).times(getTokenPrice(token, prices)).toNumber(),
      },
    ]
  })

  return (
    <StakeStatCard
      badge={
        paid.length > 0 ? (
          <Tooltip
            text={
              <div className="flex flex-col gap-y-1">
                {paid.map(({ amount, token, usd }) => (
                  <RewardRow
                    amount={amount}
                    key={token.address}
                    token={token}
                    usd={usd}
                  />
                ))}
              </div>
            }
            variant="simple"
          >
            <StatBadge>
              {paid
                .map(({ amount, token }) => `${amount} ${token.symbol}`)
                .join(' + ')}
            </StatBadge>
          </Tooltip>
        ) : undefined
      }
      isError={isUnavailable}
      isLoading={isPending && !isUnavailable}
      label={t('rewards-paid')}
      value={
        prices ? (
          formatCompactFiat(
            paid.reduce((total, { usd }) => total + usd, 0),
            locale,
          )
        ) : isPricesError ? (
          '-'
        ) : (
          <StatValueSkeleton />
        )
      }
    />
  )
}
