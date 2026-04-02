import { type ColumnDef } from '@tanstack/react-table'
import { Button } from 'components/button'
import { ErrorBoundary } from 'components/errorBoundary'
import { RenderFiatBalance } from 'components/fiatBalance'
import { Header } from 'components/table/_components/header'
import { useRouter } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { formatFiatNumber } from 'utils/format'
import { formatUnits } from 'viem'

import { type EarnPosition } from '../../types'
import { ApyWithTooltip } from '../apyWithTooltip'
import { PoolData } from '../poolData'

const Fallback = () => <span className="text-sm text-neutral-950">-</span>

export const useGetPositionsColumns = function () {
  const router = useRouter()
  const t = useTranslations('hemi-earn')

  return useMemo(
    () =>
      [
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <PoolData
                token={row.original.token}
                vaultAddress={row.original.vaultAddress}
              />
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.pool')} />,
          id: 'pool',
          meta: { width: '200px' },
        },
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <div className="flex flex-col">
                <span className="body-text-medium text-neutral-950">
                  <RenderFiatBalance
                    balance={row.original.yourDeposit}
                    customFormatter={usd => `$${formatFiatNumber(usd)}`}
                    queryStatus="success"
                    token={row.original.token}
                  />
                </span>
                <span className="body-text-normal flex gap-x-1 text-neutral-500">
                  <span>
                    {formatUnits(
                      row.original.yourDeposit,
                      row.original.token.decimals,
                    )}
                  </span>
                  <span>{row.original.token.symbol}</span>
                </span>
              </div>
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.your-deposit')} />,
          id: 'your-deposit',
          meta: { width: '200px' },
        },
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <ApyWithTooltip apy={row.original.apy} />
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.apy')} />,
          id: 'apy',
          meta: { width: '120px' },
        },
        {
          cell: ({ row }) => (
            <ErrorBoundary fallback={<Fallback />}>
              <span className="body-text-medium text-neutral-950">
                {row.original.yieldEarned}
              </span>
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.yield-earned')} />,
          id: 'yield-earned',
          meta: { width: '150px' },
        },
        {
          cell: ({ row }) => (
            <div className="flex w-full justify-start lg:justify-end">
              <Button
                onClick={() =>
                  router.push(`/hemi-earn/vault/${row.original.vaultAddress}`)
                }
                size="xSmall"
                type="button"
                variant="secondary"
              >
                {t('table.manage')}
              </Button>
            </div>
          ),
          header: () => (
            <div className="w-full max-lg:pl-4 lg:pr-4 *:lg:text-right">
              <Header text={t('table.actions')} />
            </div>
          ),
          id: 'actions',
          meta: { width: '100px' },
        },
      ] satisfies ColumnDef<EarnPosition>[],
    [router, t],
  )
}
