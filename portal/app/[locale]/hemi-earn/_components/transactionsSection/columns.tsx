'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DisplayAmount } from 'components/displayAmount'
import { ErrorBoundary } from 'components/errorBoundary'
import { InRelativeTime } from 'components/inRelativeTime'
import { Header } from 'components/table/_components/header'
import { TokenLogo } from 'components/tokenLogo'
import { type useTranslations } from 'next-intl'
import { type Address, formatUnits, isAddressEqual } from 'viem'

import { type EarnPool, type EarnTransaction } from '../../types'

import { RowActions } from './rowActions'
import { StatusBadge } from './statusBadge'

// Resolves the deposit asset from the pool registry built by
// `useHemiEarnShares`. We do NOT use the global `useToken` here because the
// hemi-earn token list is its own curated registry (`HEMI_EARN_TOKENS` in
// `_constants/tokens.ts`)
const findToken = function (pools: EarnPool[], asset: Address) {
  for (const pool of pools) {
    const match = pool.assets.find(a => isAddressEqual(a.address, asset))
    if (match) return match.token
  }
  return undefined
}

type AmountCellProps = {
  pools: EarnPool[]
  transaction: EarnTransaction
}

function AmountCell({ pools, transaction }: AmountCellProps) {
  const token = findToken(pools, transaction.asset)
  if (!token) {
    return <span className="text-neutral-950">{transaction.amountIn}</span>
  }
  return (
    <ErrorBoundary
      fallback={<span className="text-sm text-neutral-950">-</span>}
    >
      <div className="flex items-center gap-x-1.5 text-neutral-950">
        <TokenLogo size="small" token={token} />
        <DisplayAmount
          amount={formatUnits(BigInt(transaction.amountIn), token.decimals)}
          showSymbol
          showTokenLogo={false}
          token={token}
        />
      </div>
    </ErrorBoundary>
  )
}

type ColumnsContext = {
  pools: EarnPool[]
  t: ReturnType<typeof useTranslations<'hemi-earn.transactions'>>
}

export const buildColumns = ({
  pools,
  t,
}: ColumnsContext): ColumnDef<EarnTransaction>[] => [
  {
    cell: ({ row }) => (
      <span className="font-normal text-neutral-500">
        <InRelativeTime timestamp={Number(row.original.initiatedAt)} />
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
    cell: ({ row }) => <AmountCell pools={pools} transaction={row.original} />,
    header: () => <Header text={t('column.amount')} />,
    id: 'amount',
    meta: { className: 'justify-start flex-grow-0', width: 200 },
  },
  {
    cell: ({ row }) => (
      <StatusBadge kind={row.original.kind} status={row.original.status} />
    ),
    header: () => <Header text={t('column.status')} />,
    id: 'status',
    meta: { className: 'justify-start flex-grow-0', width: 190 },
  },
  {
    cell: ({ row }) => <RowActions transaction={row.original} />,
    id: 'actions',
    meta: { className: 'justify-end', width: 90 },
  },
]
