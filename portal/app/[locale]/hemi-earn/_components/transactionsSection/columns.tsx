'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DisplayAmount } from 'components/displayAmount'
import { ErrorBoundary } from 'components/errorBoundary'
import { InRelativeTime } from 'components/inRelativeTime'
import { Header } from 'components/table/_components/header'
import { TokenLogo } from 'components/tokenLogo'
import { hemi } from 'hemi-viem'
import { useToken } from 'hooks/useToken'
import { type useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { formatUnits } from 'viem'

import { useEarnPools } from '../../_hooks/useEarnPools'
import { findPoolByAsset } from '../../_utils'
import { type EarnTransaction } from '../../types'

import { RowActions } from './rowActions'
import { StatusBadge } from './statusBadge'
import { WithdrawStatusCell } from './withdrawStatusCell'

// For REDEEM, the amount unit depends on which Vetro phase the row is in:
// post-FULFILLED we have `amountOut` in asset units (hemiBTC), pre-FULFILLED
// only `amountIn` is available and it's in share-token units (svetBTC).
// The displayed token has to match: shareToken from the pool while we're
// showing shares, the Hemi-side asset token afterwards. For DEPOSIT,
// `amountIn` is already in asset units, so the generic `useToken(asset)`
// lookup is enough.
function AmountCell({ transaction }: { transaction: EarnTransaction }) {
  const { data: assetToken, isLoading } = useToken({
    address: transaction.asset,
    chainId: hemi.id,
  })
  const { data: pools = [] } = useEarnPools()
  const pool =
    transaction.kind === 'REDEEM'
      ? findPoolByAsset(pools, transaction.asset)
      : undefined

  const showingShares =
    transaction.kind === 'REDEEM' && transaction.amountOut == null
  const token = showingShares ? pool?.shareToken : assetToken
  const rawAmount = showingShares
    ? transaction.amountIn
    : (transaction.amountOut ?? transaction.amountIn)

  if (!token) {
    if (isLoading) return <Skeleton className="w-16" />
    return <span className="text-neutral-950">{rawAmount}</span>
  }
  return (
    <ErrorBoundary
      fallback={<span className="text-sm text-neutral-950">-</span>}
    >
      <div className="flex items-center gap-x-1.5 text-neutral-950">
        <TokenLogo size="small" token={token} />
        <DisplayAmount
          amount={formatUnits(BigInt(rawAmount), token.decimals)}
          showSymbol
          showTokenLogo={false}
          token={token}
        />
      </div>
    </ErrorBoundary>
  )
}

type ColumnsContext = {
  t: ReturnType<typeof useTranslations<'hemi-earn.transactions'>>
}

export const buildColumns = ({
  t,
}: ColumnsContext): ColumnDef<EarnTransaction>[] => [
  {
    cell: ({ row }) => (
      <span className="font-normal text-neutral-500">
        <InRelativeTime timestamp={Number(row.original.requestedAt)} />
      </span>
    ),
    header: () => <Header text={t('column.date')} />,
    id: 'date',
    meta: { className: 'justify-start flex-grow-0', width: 140 },
  },
  {
    cell: ({ row }) => (
      <span className="text-neutral-900">
        {row.original.kind === 'DEPOSIT' ? t('deposit') : t('withdrawal')}
      </span>
    ),
    header: () => <Header text={t('column.type')} />,
    id: 'type',
    meta: { className: 'justify-start flex-grow-0', width: 112 },
  },
  {
    cell: ({ row }) => <AmountCell transaction={row.original} />,
    header: () => <Header text={t('column.amount')} />,
    id: 'amount',
    meta: { className: 'justify-start flex-grow-0', width: 200 },
  },
  {
    cell: ({ row }) =>
      row.original.kind === 'REDEEM' ? (
        <WithdrawStatusCell transaction={row.original} />
      ) : (
        <StatusBadge transaction={row.original} />
      ),
    header: () => <Header text={t('column.status')} />,
    id: 'status',
    // Wide enough to keep the longest status ("Something went wrong - Recover
    // funds" / the manual-claim copy) on a single line across locales.
    meta: { className: 'justify-start flex-grow-0', width: 340 },
  },
  {
    cell: ({ row }) => <RowActions transaction={row.original} />,
    id: 'actions',
    // On mobile this column is reordered to the front, so it hugs the left
    // edge (the table's first-cell pl-4 gives the 16px lead). From 'md' up it
    // returns to the trailing edge and right-aligns. Wide enough to fit the
    // "Claim share tokens" / "Recover funds" CTA without overflowing the cell.
    meta: { className: 'justify-start md:justify-end', width: 180 },
  },
]
