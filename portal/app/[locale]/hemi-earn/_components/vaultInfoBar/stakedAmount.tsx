import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'use-intl'

import { sharesToPeggedOptions } from '../../_fetchers/fetchSharesToPegged'
import { useEarnPositions } from '../../_hooks/useEarnPositions'
import { type EarnVault } from '../../types'
import { RenderEarnFiatBalance } from '../earnFiatBalance'

import { VaultInfoItem } from './vaultInfoItem'

type Props = {
  vault: EarnVault
}

export const StakedAmount = function ({ vault }: Props) {
  const t = useTranslations('hemi-earn.pool-info')
  const { data: positions, isPending } = useEarnPositions()

  const position = positions.find(
    ({ shareAddress }) => shareAddress === vault.shareAddress,
  )

  // Shares → pegged shares the query key with FromVaultsBadge and useTotalDeposits,
  // so this adds no extra RPC calls.
  const { data, status } = useQuery(
    sharesToPeggedOptions({
      shareAddress: vault.shareAddress,
      shares: position?.yourDeposit ?? BigInt(0),
    }),
  )

  if (position) {
    return (
      <VaultInfoItem label={t('your-deposits')}>
        <span className="body-text-medium inline-flex items-center text-neutral-950">
          <span className="mr-1">$</span>
          <RenderEarnFiatBalance
            balance={data?.peggedAmount}
            queryStatus={status}
            token={position.peggedToken}
          />
        </span>
      </VaultInfoItem>
    )
  }

  return <VaultInfoItem isLoading={isPending} label={t('your-deposits')} />
}
