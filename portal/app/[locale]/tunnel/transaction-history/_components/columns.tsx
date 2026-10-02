import { ColumnDef } from '@tanstack/react-table'
import { ErrorBoundary } from 'components/errorBoundary'
import { Arrow } from 'components/icons/arrow'
import { FilterHeader } from 'components/table/_components/filterHeader'
import { Header } from 'components/table/_components/header'
import { HeaderButton } from 'components/table/_components/headerButton'
import { TxLink } from 'components/txLink'
import { TunnelOperation } from 'types/tunnel'
import { useTranslations } from 'use-intl'
import { isDeposit, isWithdraw } from 'utils/tunnel'

import { useFilterOptions } from '../_context/filterOptionsContext'

import { Amount } from './amount'
import { Chain as ChainComponent } from './chain'
import { DepositAction } from './depositAction'
import { DepositStatus } from './depositStatus'
import { TxTime } from './txTime'
import { WithdrawAction } from './withdrawAction'
import { WithdrawStatus } from './withdrawStatus'

type Translate = ReturnType<
  typeof useTranslations<'tunnel-page.transaction-history'>
>

// Module-level components read the filters from context: an inline header
// function would be a new component on every filter change, and the remount
// drops the keyboard focus.
const TimeHeader = function () {
  const { filterOption, setFilterOption } = useFilterOptions()
  const t = useTranslations('tunnel-page.transaction-history')

  return (
    <HeaderButton
      onClick={() =>
        setFilterOption({ ...filterOption, timeDesc: !filterOption.timeDesc })
      }
      text={t('column-headers.time')}
    >
      <Arrow className={filterOption.timeDesc ? '' : 'rotate-180'} />
    </HeaderButton>
  )
}

const TypeHeader = function () {
  const { filterOption, setFilterOption } = useFilterOptions()
  const t = useTranslations('tunnel-page.transaction-history')

  return (
    <FilterHeader
      getLabel={type => t(`filters.types.${type}`)}
      onSelect={type => setFilterOption({ ...filterOption, type })}
      options={['all', 'deposits', 'withdrawals']}
      selected={filterOption.type}
      text={t('column-headers.type')}
    />
  )
}

const ActionHeader = function () {
  const { filterOption, setFilterOption } = useFilterOptions()
  const t = useTranslations('tunnel-page.transaction-history')

  return (
    <FilterHeader
      align="right"
      getLabel={action => t(`filters.actions.${action}`)}
      onSelect={action => setFilterOption({ ...filterOption, action })}
      options={['all', 'pending']}
      selected={filterOption.action}
      text={t('column-headers.action')}
    />
  )
}

export const buildColumns = ({
  t,
}: {
  t: Translate
}): ColumnDef<TunnelOperation>[] => [
  {
    cell: ({ row }) => <TxTime timestamp={row.original.timestamp} />,
    header: TimeHeader,
    id: 'time',
    meta: { className: 'justify-start flex-grow-0', width: 130 },
  },
  {
    accessorKey: 'direction',
    cell: ({ row }) => (
      <span className="text-neutral-950">
        {t(isDeposit(row.original) ? 'deposit' : 'withdraw')}
      </span>
    ),
    header: TypeHeader,
    id: 'type',
    meta: { className: 'justify-start flex-grow-0', width: 75 },
  },
  {
    accessorKey: 'amount',
    cell: ({ row }) => (
      <ErrorBoundary
        fallback={<span className="text-sm text-neutral-950">-</span>}
      >
        <Amount operation={row.original} />
      </ErrorBoundary>
    ),
    header: () => <Header text={t('column-headers.amount')} />,
    id: 'amount',
    meta: { className: 'justify-start flex-grow-0', width: 100 },
  },
  {
    cell: ({ row }) => (
      <ChainComponent
        chainId={
          isWithdraw(row.original)
            ? row.original.l2ChainId
            : row.original.l1ChainId
        }
      />
    ),
    header: () => <Header text={t('column-headers.from')} />,
    id: 'from',
    meta: { className: 'justify-start flex-grow-0', width: 125 },
  },
  {
    cell: ({ row }) => (
      <ChainComponent
        chainId={
          isDeposit(row.original)
            ? row.original.l2ChainId
            : row.original.l1ChainId
        }
      />
    ),
    header: () => <Header text={t('column-headers.to')} />,
    id: 'to',
    meta: { className: 'justify-start flex-grow-0', width: 125 },
  },
  {
    accessorKey: 'transactionHash',
    cell({ row }) {
      const { transactionHash } = row.original
      const chainId = isWithdraw(row.original)
        ? row.original.l2ChainId
        : row.original.l1ChainId
      return <TxLink chainId={chainId} txHash={transactionHash} />
    },
    header: () => <Header text={t('column-headers.tx-hash')} />,
    id: 'transactionHash',
    meta: { className: 'justify-start flex-grow-0', width: 135 },
  },
  {
    accessorKey: 'status',
    cell: ({ row }) =>
      isDeposit(row.original) ? (
        <DepositStatus deposit={row.original} />
      ) : (
        <WithdrawStatus withdrawal={row.original} />
      ),
    header: () => <Header text={t('column-headers.status')} />,
    id: 'status',
    meta: { className: 'justify-start', width: 170 },
  },
  {
    cell: ({ row }) => (
      <div className="flex w-full shrink-0 items-center justify-start *:shrink-0 lg:justify-end">
        {isDeposit(row.original) ? (
          <DepositAction deposit={row.original} />
        ) : (
          <WithdrawAction withdraw={row.original} />
        )}
      </div>
    ),
    header: ActionHeader,
    id: 'action',
    meta: { className: 'justify-start lg:justify-end', width: 125 },
  },
]
