'use client'

import { Button } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { RenderFiatBalance } from 'components/fiatBalance'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { useChain } from 'hooks/useChain'
import { useNetworkType } from 'hooks/useNetworkType'
import { useRouter } from 'i18n/navigation'
import { mainnet } from 'networks/mainnet'
import { useLocale, useTranslations } from 'next-intl'
import { formatCompactFiat, formatEvmAddress } from 'utils/format'
import { queryStringObjectToString } from 'utils/url'

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
  const router = useRouter()
  const [networkType] = useNetworkType()
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

  const handleManage = () =>
    router.push(
      `/hemi-earn/pool/${pool.shareAddress}${queryStringObjectToString({
        networkType,
      })}`,
    )

  return (
    <div className="md:min-h-19 flex w-full flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:gap-6">
      <div className="w-19 flex h-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
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
        <Button onClick={handleManage} size="xSmall" variant="primary">
          {t('manage')}
        </Button>
      </div>
    </div>
  )
}
