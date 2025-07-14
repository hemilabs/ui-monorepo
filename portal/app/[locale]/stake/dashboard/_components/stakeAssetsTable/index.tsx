'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ButtonLink } from 'components/button'
import { Card } from 'components/card'
import { TokenLogo } from 'components/tokenLogo'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useUmami } from 'hooks/useUmami'
import { useWindowSize } from 'hooks/useWindowSize'
import { useRouter } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import { MouseEvent, RefObject, useMemo, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import { StakeToken } from 'types/stake'
import { sortTokens } from 'utils/sortTokens'
import { getTokenSymbol } from 'utils/token'
import { queryStringObjectToString } from 'utils/url'

import { ProtocolImage } from '../../../_components/protocolImage'
import { StakedBalance } from '../../../_components/stakedBalance'
import { StakedBalanceUsd } from '../../../_components/stakedBalanceUsd'
import { Column, ColumnHeader, Header } from '../../../_components/table'
import { TokenBalance } from '../../../_components/tokenBalance'
import { TokenRewards } from '../../../_components/tokenRewards'
import { useDrawerStakeQueryString } from '../../../_hooks/useDrawerStakeQueryString'
import { useStakePositions } from '../../../_hooks/useStakedBalance'

import { WelcomeStake } from './welcomeStake'

type ActionProps = {
  stake: StakeToken
}
const rowSize = 52
const Body = function ({
  columns,
  containerRef,
  loading,
  rows,
}: {
  columns: ColumnDef<StakeToken>[]
  containerRef: RefObject<HTMLDivElement>
  loading: boolean
  rows: Row<StakeToken>[]
}) {
  const { setDrawerQueryString } = useDrawerStakeQueryString()
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowSize,
    getScrollElement: () => containerRef.current,
    initialRect: {
      // Estimation to fix the initial render that's broken. See https://github.com/TanStack/virtual/issues/871
      height: rows.length * rowSize,
      // Not relevant, but type mandatory
      width: 0,
    },
    overscan: 10,
  })

  // TODO add analytics for this event https://github.com/hemilabs/ui-monorepo/issues/765
  const openDrawer = (token: StakeToken) =>
    setDrawerQueryString('manage', token.address)

  return (
    <tbody
      className="relative"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {loading &&
        rows.length === 0 &&
        Array.from(Array(4).keys()).map(index => (
          <tr className="flex items-center" key={index}>
            {columns.map(c => (
              <Column key={c.id} style={{ width: c.meta?.width }}>
                {/* @ts-expect-error it works */}
                {c.cell()}
              </Column>
            ))}
          </tr>
        ))}
      {(!loading || rows.length > 0) && (
        <>
          {rowVirtualizer.getVirtualItems().map(function (virtualRow) {
            const row = rows[virtualRow.index] as Row<StakeToken>
            return (
              <tr
                className="group/stake-row absolute flex w-full items-center"
                data-index={virtualRow.index}
                key={row.id}
                onClick={() => openDrawer(row.original)}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <Column
                    key={cell.id}
                    style={{ width: cell.column.columnDef.meta?.width }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Column>
                ))}
              </tr>
            )
          })}
        </>
      )}
    </tbody>
  )
}

const CallToAction = function ({ stake }: ActionProps) {
  const pathname = usePathnameWithoutLocale()

  const queryString = queryStringObjectToString({
    mode: 'manage',
    tokenAddress: stake.address,
  })

  return (
    <ButtonLink
      className="border-none"
      href={`${pathname}${queryString}`}
      onClick={function (e) {
        // prevent full navigation - we want a shallow navigation to open the drawer
        e.preventDefault()
        // navigation is done in event delegation, in the row
      }}
      variant="secondary"
    >
      <span className="text-lg font-normal text-neutral-500 transition duration-300 hover:text-neutral-950">
        ···
      </span>
    </ButtonLink>
  )
}

const columnsBuilder = (
  t: ReturnType<typeof useTranslations<'stake-page'>>,
): ColumnDef<StakeToken>[] => [
  {
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <ProtocolImage protocol={row.original.extensions.protocol} />
      </div>
    ),
    header: () => <Header text={t('protocol')} />,
    id: 'protocol',
    meta: { width: '150px' },
  },
  {
    cell: ({ row }) => (
      <div className="flex items-center justify-center space-x-2">
        <TokenLogo size="small" token={row.original} />
        <span className="text-neutral-950">{getTokenSymbol(row.original)}</span>
      </div>
    ),
    header: () => <Header text={t('asset')} />,
    id: 'asset',
    meta: { width: '120px' },
  },
  {
    cell: ({ row }) => (
      <TokenBalance
        balance={<StakedBalance token={row.original} />}
        balanceUsd={<StakedBalanceUsd token={row.original} />}
      />
    ),
    header: () => <Header text={t('dashboard.staked')} />,
    id: 'staked',
    meta: { width: '100px' },
  },
  {
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-1 overflow-hidden">
        <TokenRewards rewards={row.original.extensions.rewards} />
      </div>
    ),
    header: () => <Header text={t('rewards')} />,
    id: 'rewards',
    meta: { width: '350px' },
  },
  {
    cell: ({ row }) => (
      <div className="max-w-24">
        <CallToAction stake={row.original} />
      </div>
    ),
    id: 'action',
    meta: { width: '50px' },
  },
]

type Props = {
  containerRef: RefObject<HTMLDivElement>
  data: StakeToken[]
  loading: boolean
}

const StakeAssetsTableImp = function ({ containerRef, data, loading }: Props) {
  const t = useTranslations('stake-page')
  const { width } = useWindowSize()

  const columns = useMemo(
    () =>
      columnsBuilder(t).map(c =>
        data.length === 0 && loading
          ? {
              ...c,
              cell: () => <Skeleton className="w-16" />,
            }
          : c,
      ),
    [data.length, loading, t],
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder:
        // move "action" to the left in small devices
        // and keep original order in larger devices
        width < 1024
          ? ['action'].concat(
              columns.map(c => c.id).filter(id => id !== 'action'),
            )
          : undefined,
    },
  })

  const { rows } = table.getRowModel()

  return (
    <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
      <thead className="sticky top-0 z-10">
        {table.getHeaderGroups().map(headerGroup => (
          <tr className="flex w-full items-center" key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <ColumnHeader
                key={header.id}
                style={{ width: header.column.columnDef.meta?.width }}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </ColumnHeader>
            ))}
          </tr>
        ))}
      </thead>
      <Body
        columns={columns}
        containerRef={containerRef}
        loading={loading}
        rows={rows}
      />
    </table>
  )
}

export const StakeAssetsTable = function () {
  const [networkType] = useNetworkType()
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const t = useTranslations('stake-page')
  const { track } = useUmami()
  const { loading: isLoadingBalance, tokensWithPosition } = useStakePositions()

  const {
    data: prices,
    errorUpdateCount,
    isPending: isLoadingPrices,
  } = useTokenPrices()

  const isLoading = isLoadingBalance || isLoadingPrices

  const sortedTokens = useMemo(
    () =>
      // If prices errored, let's show the tokens without price ordering.
      // If the prices API eventually comes back, prices will be redefined and they will
      // be sorted as expected.
      !isLoading || errorUpdateCount > 0
        ? sortTokens(tokensWithPosition, prices)
        : [],
    [isLoading, errorUpdateCount, tokensWithPosition, prices],
  )

  if (tokensWithPosition.length === 0) {
    return <WelcomeStake />
  }

  const stakeMoreUrl = 'stake'

  function goToStakePage(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    e.stopPropagation()
    track?.('stake - stake more')
    const queryString = queryStringObjectToString({ networkType })
    router.push(`/${stakeMoreUrl}${queryString}`)
  }

  return (
    <div className="rounded-2.5xl bg-neutral-100 p-1 text-sm font-medium">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3.5 py-2 md:flex-nowrap md:px-3">
        <h5 className="flex-shrink-0 flex-grow basis-2/5 md:flex-grow-0 md:basis-auto">
          {t('dashboard.staking-assets')}
        </h5>
        <div className="[&>a]:py-1">
          <ButtonLink href={stakeMoreUrl} onClick={goToStakePage}>
            <span className="mr-1">+{t('dashboard.stake-more')}</span>
          </ButtonLink>
        </div>
      </div>
      <Card>
        <div
          className="max-h-[50dvh] overflow-x-auto p-2"
          ref={containerRef}
          style={{
            scrollbarColor: '#d4d4d4 transparent',
            scrollbarWidth: 'thin',
          }}
        >
          <StakeAssetsTableImp
            containerRef={containerRef}
            data={sortedTokens}
            loading={isLoading}
          />
        </div>
      </Card>
    </div>
  )
}
