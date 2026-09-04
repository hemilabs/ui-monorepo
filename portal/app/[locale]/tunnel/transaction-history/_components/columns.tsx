import { ColumnDef } from '@tanstack/react-table'
import { ErrorBoundary } from 'components/errorBoundary'
import { Arrow } from 'components/icons/arrow'
import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import { Header } from 'components/table/_components/header'
import { TxLink } from 'components/txLink'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

const edgeGap = 8

// `Menu` insets its items (p-1 + px-2), so aligning the boxes would leave the
// item text off by this much against the column header.
const menuTextInset = 12

type FilterMenuProps = {
  align?: 'left' | 'right'
  items: { content: React.ReactNode; id: string }[]
  text: string
}

// Portaled to the body: the header lives inside an `overflow-x-hidden` container,
// which would clip the menu, and the body card paints over it.
const FilterHeader = function ({
  align = 'left',
  items,
  text,
}: FilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(
    function closeOnOutsideClick() {
      if (!isOpen) {
        return undefined
      }
      // The trigger has to be excluded too: closing on its mousedown would let
      // its own onClick reopen the menu right away.
      const onMouseDown = function (event: MouseEvent) {
        const target = event.target as Node
        if (
          menuRef.current?.contains(target) ||
          triggerRef.current?.contains(target)
        ) {
          return
        }
        setIsOpen(false)
      }
      document.addEventListener('mousedown', onMouseDown)
      return () => document.removeEventListener('mousedown', onMouseDown)
    },
    [isOpen],
  )

  useLayoutEffect(
    function positionMenu() {
      if (!isOpen || !triggerRef.current) {
        return undefined
      }
      const place = function () {
        const rect = triggerRef.current!.getBoundingClientRect()
        const width = menuRef.current?.offsetWidth ?? 0
        const preferred =
          align === 'right'
            ? rect.right - width + menuTextInset
            : rect.left - menuTextInset
        setPosition({
          // Keeps the menu inside the viewport: on small screens the action
          // column is the first one, so aligning it right would push it off.
          left: Math.min(
            Math.max(edgeGap, preferred),
            window.innerWidth - width - edgeGap,
          ),
          top: rect.bottom + 4,
        })
      }
      place()
      // The menu is portaled and fixed, so it can't follow the header on its
      // own: close it rather than leave it at stale coordinates.
      const close = () => setIsOpen(false)
      window.addEventListener('scroll', close, true)
      window.addEventListener('resize', close)
      return function () {
        window.removeEventListener('scroll', close, true)
        window.removeEventListener('resize', close)
      }
    },
    [align, isOpen],
  )

  return (
    <span className="flex flex-col">
      <span
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        ref={triggerRef}
      >
        <Header text={text} />
        <Chevron.Bottom className={isOpen ? 'rotate-180' : ''} />
      </span>
      {isOpen &&
        createPortal(
          <div
            className="fixed z-20"
            ref={menuRef}
            style={{ left: position.left, top: position.top }}
          >
            <Menu items={items} />
          </div>,
          document.body,
        )}
    </span>
  )
}

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
    meta: { className: 'justify-start flex-grow-0', width: 100 },
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
    meta: { className: 'justify-start flex-grow-0', width: 100 },
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
    meta: { className: 'justify-start', width: 185 },
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
