import { type ColumnDef } from '@tanstack/react-table'
import { Header } from 'components/table/_components/header'
import { useMemo } from 'react'
import { type EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { formatPercentage } from 'utils/format'

import { RenderEarnFiatBalance } from '../../../../_components/earnFiatBalance'
import { type CompositionItem } from '../../_hooks/useComposition'

export type CompositionItemWithColor = CompositionItem & { color: string }

// Vetro returns shares as fractions; formatPercentage expects a percentage.
export const shareToPercentage = (share: number) => share * 100

export const useGetCompositionColumns = function (peggedToken: EvmToken) {
  const t = useTranslations('hemi-earn.vault.composition')

  return useMemo(
    () =>
      [
        {
          cell: ({ row }) => (
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className="h-3 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: row.original.color }}
              />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-neutral-950">
                {row.original.name}
              </span>
            </div>
          ),
          header: () => <Header text={t('position')} />,
          id: 'position',
          meta: { width: 200 },
        },
        {
          cell: ({ row }) => (
            <span className="text-sm font-medium text-neutral-500">
              $
              <RenderEarnFiatBalance
                balance={row.original.amount}
                queryStatus="success"
                token={peggedToken}
              />
            </span>
          ),
          header: () => <Header text={t('amount')} />,
          id: 'amount',
          meta: { className: 'justify-end', width: 120 },
        },
        {
          cell: ({ row }) => (
            <span className="text-sm font-medium text-neutral-950">
              {formatPercentage(shareToPercentage(row.original.share))}
            </span>
          ),
          header: () => <Header text={t('share')} />,
          id: 'share',
          meta: { className: 'justify-end', width: 112 },
        },
      ] satisfies ColumnDef<CompositionItemWithColor>[],
    [peggedToken, t],
  )
}
