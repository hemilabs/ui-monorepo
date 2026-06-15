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

import { type EarnTransaction } from '../../types'

import { RowActions } from './rowActions'
import { StatusBadge } from './statusBadge'
import { WithdrawStatusCell } from './withdrawStatusCell'

// Resolves the deposit asset's metadata through the shared token query (token
// list with an on-chain erc20 fallback), keyed off the transaction's
// Hemi-side asset address.
// For REDEEM, `amountIn` is in share-token units (svetBTC), so prefer
// `amountOut` (asset units) once Vetro reports it; until then the share
// amount is a close enough approximation. For DEPOSIT, `amountIn` is
// already in asset units.
const displayAmountFor = (transaction: EarnTransaction) =>
  transaction.kind === 'REDEEM'
    ? transaction.amountOut ?? transaction.amountIn
    : transaction.amountIn

function AmountCell({ transaction }: { transaction: EarnTransaction }) {
  const { data: token, isLoading } = useToken({
    address: transaction.asset,
    chainId: hemi.id,
  })
  const rawAmount = displayAmountFor(transaction)

  if (isLoading) {
    return <Skeleton className="w-16" />
  }
  if (!token) {
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
