import { useQueries } from '@tanstack/react-query'
import { Badge } from 'components/badge'
import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import { type EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { formatNumber } from 'utils/format'
import { formatUnits } from 'viem'

import { sharesToPeggedOptions } from '../_fetchers/fetchSharesToPegged'
import { useEarnPositions } from '../_hooks/useEarnPositions'

import { RenderEarnFiatBalance } from './earnFiatBalance'

type VaultRowProps = {
  peggedAmount: bigint | undefined
  peggedAmountStatus: 'error' | 'pending' | 'success'
  peggedToken: EvmToken
  shareAmount: bigint
  shareToken: EvmToken
}

const VaultRow = ({
  peggedAmount,
  peggedAmountStatus,
  peggedToken,
  shareAmount,
  shareToken,
}: VaultRowProps) => (
  <div className="flex items-center gap-x-1 sm:min-w-52">
    <TokenLogo size="small" token={shareToken} />
    <span className="mr-auto text-sm font-medium text-white">
      {shareToken.symbol}
    </span>
    <span className="text-sm font-medium text-white">
      $
      <RenderEarnFiatBalance
        balance={peggedAmount}
        queryStatus={peggedAmountStatus}
        token={peggedToken}
      />
    </span>
    <span className="text-sm font-medium text-neutral-400">
      ({formatNumber(formatUnits(shareAmount, shareToken.decimals))}{' '}
      {shareToken.symbol})
    </span>
  </div>
)

export const FromVaultsBadge = function () {
  const t = useTranslations('hemi-earn.info')
  const { data: positions = [], isError, isPending } = useEarnPositions()

  const peggedAmountQueries = useQueries({
    queries: positions.map(position =>
      sharesToPeggedOptions({
        shareAddress: position.shareAddress,
        shares: position.yourDeposit,
      }),
    ),
  })

  const count = positions.length

  if (isError || isPending || count === 0) {
    return null
  }

  return (
    <Tooltip
      text={
        <div className="flex flex-col gap-y-1">
          {positions.map((position, index) => (
            <VaultRow
              key={position.shareAddress}
              peggedAmount={peggedAmountQueries[index]?.data?.peggedAmount}
              peggedAmountStatus={
                peggedAmountQueries[index]?.status ?? 'pending'
              }
              peggedToken={position.peggedToken}
              shareAmount={position.yourDeposit}
              shareToken={position.shareToken}
            />
          ))}
        </div>
      }
      variant="simple"
    >
      <Badge size="small" variant="secondary">
        {t('from-vaults', { count })}
      </Badge>
    </Tooltip>
  )
}
