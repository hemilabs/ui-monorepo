'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useUmami } from 'app/analyticsEvents'
import { ButtonLink } from 'components/button'
import { Card } from 'components/card'
import { Balance } from 'components/cryptoBalance'
import { ExternalLink } from 'components/externalLink'
import { FiatBalance } from 'components/fiatBalance'
import { TokenLogo } from 'components/tokenLogo'
import { useWindowSize } from 'hooks/useWindowSize'
import { useTranslations } from 'next-intl'
import { MouseEvent, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { StakeToken } from 'types/stake'

import { useDrawerStakeQueryString } from '../../_hooks/useDrawerStakeQueryString'
import { ProtocolImage } from '../protocolImage'
import { Column, ColumnHeader, Header } from '../table'
import { TokenBalance } from '../tokenBalance'
import { TokenRewards } from '../tokenRewards'

// created here so there's a stable reference between renders when using it
const emptyData = new Array(4).fill(null)

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
        <span className="text-neutral-950">{row.original.symbol}</span>
      </div>
    ),
    header: () => <Header text={t('asset')} />,
    id: 'asset',
    meta: { width: '120px' },
  },
  {
    cell: ({ row }) => (
      <TokenBalance
        balance={<Balance token={row.original} />}
        balanceUsd={<FiatBalance token={row.original} />}
      />
    ),
    header: () => <Header text={t('wallet-balance')} />,
    id: 'wallet-balance',
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
    cell: function CallToAction({ row }) {
      const { setDrawerQueryString } = useDrawerStakeQueryString()

      return (
        <div className="max-w-24">
          <ButtonLink
            href={{
              pathname: '/stake',
              query: {
                address: row.original.address,
                mode: 'stake',
              },
            }}
            onClick={function (e) {
              e.preventDefault()
              e.stopPropagation()
              setDrawerQueryString('stake', row.original.address)
            }}
          >
            {t('stake.title')}
          </ButtonLink>
        </div>
      )
    },
    header: () => <Header text={t('stake.action')} />,
    id: 'action',
    meta: { width: '80px' },
  },
]

type StakeStrategyTableImpProps = {
  data: StakeToken[]
  loading: boolean
}

const StakeStrategyTableImp = function ({
  data,
  loading,
}: StakeStrategyTableImpProps) {
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
    data: data.length === 0 ? emptyData : data,
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
      <tbody className="relative">
        {rows.map(row => (
          <tr className="group/stake-row flex items-center" key={row.id}>
            {row.getVisibleCells().map(cell => (
              <Column
                key={cell.id}
                style={{ width: cell.column.columnDef.meta?.width }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Column>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type Props = {
  data: StakeToken[]
  loading: boolean
}

export const StakeStrategyTable = function ({ data, loading }: Props) {
  const t = useTranslations('stake-page.stake')
  const { track } = useUmami()

  const learnHowToStakeLink =
    'https://docs.hemi.xyz/how-to-tutorials/using-hemi/stake'

  const trackLinkClick = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    e.stopPropagation()
    track?.('stake - learn stake')
    // open external link
    window.open(learnHowToStakeLink, '_blank')
  }

  return (
    <div className="rounded-2.5xl bg-neutral-100 p-1 text-sm font-medium">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3.5 py-2 md:flex-nowrap md:px-3">
        <h5 className="flex-shrink-0 md:flex-grow-0 md:basis-auto">
          {t('strategy')}
        </h5>
        <p className="flex text-sm font-normal text-neutral-600">
          {t('new-here')}
          <ExternalLink href={learnHowToStakeLink} onClick={trackLinkClick}>
            <span className="ml-1 text-orange-500 hover:text-orange-700">
              {t('learn-how-to-stake-on-hemi')}
            </span>
          </ExternalLink>
        </p>
      </div>
      <Card>
        <div
          className="max-h-[48dvh] overflow-x-auto p-2"
          style={{
            scrollbarColor: '#d4d4d4 transparent',
            scrollbarWidth: 'thin',
          }}
        >
          <StakeStrategyTableImp data={data} loading={loading} />
        </div>
      </Card>
    </div>
  )
}
