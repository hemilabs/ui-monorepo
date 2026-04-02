import { type ColumnDef } from '@tanstack/react-table'
import { Button } from 'components/button'
import { ErrorBoundary } from 'components/errorBoundary'
import { RenderFiatBalance } from 'components/fiatBalance'
import { Header } from 'components/table/_components/header'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { formatFiatNumber } from 'utils/format'
import { formatUnits } from 'viem'

import { type EarnPool } from '../../types'
import { ApyWithTooltip } from '../apyWithTooltip'
import { ExposureTokens } from '../exposureTokens'
import { PoolData } from '../poolData'

const Fallback = () => <span className="text-sm text-neutral-950">-</span>

export const useGetPoolsColumns = function () {
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
                    balance={row.original.totalDeposits}
                    customFormatter={usd => `$${formatFiatNumber(usd)}`}
                    queryStatus="success"
                    token={row.original.token}
                  />
                </span>
                <span className="body-text-normal flex gap-x-1 text-neutral-500">
                  <span>
                    {formatUnits(
                      row.original.totalDeposits,
                      row.original.token.decimals,
                    )}
                  </span>
                  <span>{row.original.token.symbol}</span>
                </span>
              </div>
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.total-deposits')} />,
          id: 'total-deposits',
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
              <ExposureTokens tokens={row.original.exposureTokens} />
            </ErrorBoundary>
          ),
          header: () => <Header text={t('table.exposure')} />,
          id: 'exposure',
          meta: { width: '120px' },
        },
        {
          cell: () => (
            <div className="flex w-full justify-start lg:justify-end">
              {/* TODO: open deposit drawer — to be implemented in a future PR */}
              <Button size="xSmall" type="button" variant="primary">
                {t('table.deposit-and-earn-yield')}
              </Button>
            </div>
          ),
          header: () => (
            <div className="w-full max-lg:pl-4 lg:pr-4 *:lg:text-right">
              <Header text={t('table.actions')} />
            </div>
          ),
          id: 'actions',
          meta: { width: '260px' },
        },
      ] satisfies ColumnDef<EarnPool>[],
    [t],
  )
}
