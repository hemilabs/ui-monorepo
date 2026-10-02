import { ColumnDef } from '@tanstack/react-table'
import { ErrorBoundary } from 'components/errorBoundary'
import { Arrow } from 'components/icons/arrow'
import { CheckMark } from 'components/icons/checkMark'
import { FilterHeader } from 'components/table/_components/filterHeader'
import { Header } from 'components/table/_components/header'
import { TxLink } from 'components/txLink'
import { TunnelOperation } from 'types/tunnel'
import { useTranslations } from 'use-intl'
import { isDeposit, isWithdraw } from 'utils/tunnel'

import { Amount } from './amount'
import { Chain as ChainComponent } from './chain'
import { DepositAction } from './depositAction'
import { DepositStatus } from './depositStatus'
import { FilterOptions } from './topBar'
import { TxTime } from './txTime'
import { WithdrawAction } from './withdrawAction'
import { WithdrawStatus } from './withdrawStatus'

type Translate = ReturnType<
  typeof useTranslations<'tunnel-page.transaction-history'>
>

type FilterProps = {
  filterOption: FilterOptions
  setFilterOption: (filter: FilterOptions) => void
}

const TimeHeader = ({
  filterOption,
  setFilterOption,
  text,
}: FilterProps & { text: string }) => (
  <span
    className="flex cursor-pointer items-center gap-2"
    onClick={() =>
      setFilterOption({ ...filterOption, timeDesc: !filterOption.timeDesc })
    }
  >
    <Header text={text} />
    <Arrow className={`${filterOption.timeDesc ? '' : 'rotate-180'}`} />
  </span>
)

const TypeHeader = function ({
  filterOption,
  setFilterOption,
  t,
}: FilterProps & { t: Translate }) {
  const types = ['all', 'deposits', 'withdrawals'] as FilterOptions['type'][]

  return (
    <FilterHeader
      items={types.map(type => ({
        content: (
          <button
            className="flex items-center gap-x-2"
            disabled={filterOption.type === type}
            onClick={() => setFilterOption({ ...filterOption, type })}
          >
            <span className="whitespace-nowrap">
              {t(`filters.types.${type}`)}
            </span>
            <div className={filterOption.type === type ? 'block' : 'invisible'}>
              <CheckMark />
            </div>
          </button>
        ),
        id: type,
      }))}
      text={t('column-headers.type')}
    />
  )
}

const ActionHeader = function ({
  filterOption,
  setFilterOption,
  t,
}: FilterProps & { t: Translate }) {
  const actions = ['all', 'pending'] as FilterOptions['action'][]

  return (
    <FilterHeader
      align="right"
      items={actions.map(action => ({
        content: (
          <button
            className="flex items-center gap-x-2"
            disabled={filterOption.action === action}
            onClick={() => setFilterOption({ ...filterOption, action })}
          >
            <span className="whitespace-nowrap">
              {t(`filters.actions.${action}`)}
            </span>
            <div
              className={filterOption.action === action ? 'block' : 'invisible'}
            >
              <CheckMark />
            </div>
          </button>
        ),
        id: action,
      }))}
      text={t('column-headers.action')}
    />
  )
}

type BuildColumnsProps = FilterProps & { t: Translate }

export const buildColumns = ({
  filterOption,
  setFilterOption,
  t,
}: BuildColumnsProps): ColumnDef<TunnelOperation>[] => [
  {
    cell: ({ row }) => <TxTime timestamp={row.original.timestamp} />,
    header: () => (
      <TimeHeader
        filterOption={filterOption}
        setFilterOption={setFilterOption}
        text={t('column-headers.time')}
      />
    ),
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
    header: () => (
      <TypeHeader
        filterOption={filterOption}
        setFilterOption={setFilterOption}
        t={t}
      />
    ),
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
    header: () => (
      <ActionHeader
        filterOption={filterOption}
        setFilterOption={setFilterOption}
        t={t}
      />
    ),
    id: 'action',
    meta: { className: 'justify-start lg:justify-end', width: 125 },
  },
]
