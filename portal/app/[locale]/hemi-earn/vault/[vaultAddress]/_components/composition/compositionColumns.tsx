import { type ColumnDef } from '@tanstack/react-table'
import { Header } from 'components/table/_components/header'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { formatFiatNumber, formatPercentage } from 'utils/format'

import { type CompositionItem } from '../../_hooks/useComposition'

export type CompositionItemWithColor = CompositionItem & { color: string }

export const useGetCompositionColumns = function () {
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
          meta: { width: '200px' },
        },
        {
          cell: ({ row }) => (
            <span className="text-sm font-medium text-neutral-500">
              ${formatFiatNumber(row.original.amount)}
            </span>
          ),
          header: () => <Header text={t('amount')} />,
          id: 'amount',
          meta: { className: 'justify-end', width: '120px' },
        },
        {
          cell: ({ row }) => (
            <span className="text-sm font-medium text-orange-600">
              {formatPercentage(row.original.apy)}
            </span>
          ),
          header: () => <Header text={t('apy')} />,
          id: 'apy',
          meta: { className: 'justify-end', width: '80px' },
        },
        {
          cell: ({ row }) => (
            <span className="text-sm font-medium text-neutral-950">
              {row.original.share}%
            </span>
          ),
          header: () => <Header text={t('share')} />,
          id: 'share',
          meta: { className: 'justify-end', width: '80px' },
        },
      ] satisfies ColumnDef<CompositionItemWithColor>[],
    [t],
  )
}
