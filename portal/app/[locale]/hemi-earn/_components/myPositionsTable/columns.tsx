import { type ColumnDef } from '@tanstack/react-table'
import { Button } from 'components/button'
import { ErrorBoundary } from 'components/errorBoundary'
import { Header } from 'components/table/_components/header'
import { useNetworkType } from 'hooks/useNetworkType'
import { useRouter } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { queryStringObjectToString } from 'utils/url'
import { type Address, formatUnits } from 'viem'

import { type EarnPosition } from '../../types'
import { ApyWithTooltip } from '../apyWithTooltip'
import { PoolData } from '../poolData'
import { ShareFiatBalance } from '../shareFiatBalance'

const Fallback = () => <span className="text-sm text-neutral-950">-</span>

const ManageAction = function ({ shareAddress }: { shareAddress: Address }) {
  const router = useRouter()
  const t = useTranslations('hemi-earn')
  const [networkType] = useNetworkType()
  return (
    <div className="flex w-full justify-start lg:justify-end">
      <Button
        onClick={() =>
          router.push(
            `/hemi-earn/pool/${shareAddress}${queryStringObjectToString({
              networkType,
            })}`,
          )
        }
        size="xSmall"
        type="button"
        variant="secondary"
      >
        {t('table.manage')}
      </Button>
    </div>
  )
}

export const useGetPositionsColumns = function () {
  const t = useTranslations('hemi-earn')

  return useMemo(
    () =>
      [
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <PoolData
                shareAddress={row.original.shareAddress}
                shareToken={row.original.shareToken}
              />
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.pool')} />,
          id: 'pool',
          meta: { width: 200 },
        },
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <div className="flex flex-col">
                <span className="body-text-medium text-neutral-950">
                  <ShareFiatBalance
                    peggedToken={row.original.peggedToken}
                    shareAddress={row.original.shareAddress}
                    shares={row.original.yourDeposit}
                  />
                </span>
                <span className="body-text-normal flex gap-x-1 text-neutral-500">
                  <span>
                    {formatUnits(
                      row.original.yourDeposit,
                      row.original.shareToken.decimals,
                    )}
                  </span>
                  <span>{row.original.shareToken.symbol}</span>
                </span>
              </div>
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.your-deposit')} />,
          id: 'your-deposit',
          meta: { width: 200 },
        },
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <ApyWithTooltip apy={row.original.apy} />
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.apy')} />,
          id: 'apy',
          meta: { width: 120 },
        },
        {
          cell: ({ row }) => (
            <ManageAction shareAddress={row.original.shareAddress} />
          ),
          header: () => (
            <div className="w-full max-lg:pl-4 lg:pr-4 *:lg:text-right">
              <Header text={t('table.actions')} />
            </div>
          ),
          id: 'actions',
          meta: { width: 100 },
        },
      ] satisfies ColumnDef<EarnPosition>[],
    [t],
  )
}
