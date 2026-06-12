'use client'

import { ButtonLink } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { RenderFiatBalance } from 'components/fiatBalance'
import { TokenLogo } from 'components/tokenLogo'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { useChain } from 'hooks/useChain'
import { mainnet } from 'networks/mainnet'
import { useLocale, useTranslations } from 'next-intl'
import { formatCompactFiat, formatEvmAddress } from 'utils/format'

import { useEarnRewards } from '../../_hooks/useEarnRewards'
import { formatApyDisplay } from '../../_utils'
import { type EarnPool } from '../../types'

import { PoolInfoItem } from './poolInfoItem'
import { TokenIconStack } from './tokenIconStack'

type Props = {
  pool: EarnPool
}

export const PoolInfoBar = function ({ pool }: Props) {
  const t = useTranslations('hemi-earn.pool-info')
  const locale = useLocale()
  const chain = useChain(pool.shareToken.chainId)

  const stakingVaultAddress = getStakingVaultForShare(pool.shareAddress)
  const { data: rewards = [], isLoading: isRewardsLoading } =
    useEarnRewards(stakingVaultAddress)

  const rewardTokens = rewards.map(reward => ({
    address: reward.token.address,
    chainId: mainnet.id,
  }))

  const formattedAddress = formatEvmAddress(pool.shareAddress)
  const explorerUrl = chain?.blockExplorers?.default.url

  return (
    <div className="md:min-h-19.5 flex w-full flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:gap-6">
      <div className="md:w-19 flex h-10 w-full shrink-0 items-center justify-center rounded-lg bg-neutral-100">
        <TokenIconStack tokens={pool.exposureTokens} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:flex md:flex-1 md:items-center md:gap-6">
        <PoolInfoItem label={t('pool-contract')}>
          <span className="body-text-medium text-neutral-950">
            {explorerUrl ? (
              <ExternalLink
                className="hover:text-orange-500"
                href={`${explorerUrl}/address/${pool.shareAddress}`}
              >
                {formattedAddress}
              </ExternalLink>
            ) : (
              formattedAddress
            )}
          </span>
        </PoolInfoItem>
        <PoolInfoItem label={t('share-token')}>
          <div className="flex items-center gap-x-1.5">
            <div className="flex items-center justify-center rounded-full border border-gray-200">
              <TokenLogo size="small" token={pool.shareToken} version="L1" />
            </div>
            <span className="body-text-medium text-neutral-950">
              {pool.shareToken.symbol}
            </span>
          </div>
        </PoolInfoItem>
        <PoolInfoItem label={t('total-deposits')}>
          <span className="body-text-medium text-neutral-950">
            <RenderFiatBalance
              balance={pool.totalDeposits}
              customFormatter={usd => formatCompactFiat(Number(usd), locale)}
              queryStatus="success"
              token={pool.peggedToken}
            />
          </span>
        </PoolInfoItem>
        <PoolInfoItem
          isLoading={isRewardsLoading}
          label={t('potential-rewards')}
        >
          {!isRewardsLoading ? (
            <TokenIconStack interactive tokens={rewardTokens} />
          ) : undefined}
        </PoolInfoItem>
        <PoolInfoItem
          isLoading={pool.apy === undefined}
          label={t('apy')}
          value={
            typeof pool.apy === 'number'
              ? formatApyDisplay(pool.apy)
              : undefined
          }
        />
      </div>
      <div className="flex w-full *:flex-1 md:ml-auto md:w-auto md:*:flex-initial">
        <ButtonLink
          href={`/hemi-earn/pool/${pool.shareAddress}`}
          size="small"
          variant="primary"
        >
          {t('manage')}
        </ButtonLink>
      </div>
    </div>
  )
}
