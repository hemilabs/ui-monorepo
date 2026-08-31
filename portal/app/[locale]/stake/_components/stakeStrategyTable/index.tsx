'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ButtonLink } from 'components/button'
import { Balance } from 'components/cryptoBalance'
import { FiatBalance } from 'components/fiatBalance'
import { Table } from 'components/table'
import { Header } from 'components/table/_components/header'
import { TokenLogo } from 'components/tokenLogo'
import { useMemo } from 'react'
import { StakeToken } from 'types/stake'
import { useTranslations } from 'use-intl'

import { useDrawerStakeQueryString } from '../../_hooks/useDrawerStakeQueryString'
import { ProtocolImage } from '../protocolImage'
import { TokenBalance } from '../tokenBalance'

type StakeColumnsProps = {
  t: ReturnType<typeof useTranslations<'stake-page'>>
}

const stakeColumns = ({ t }: StakeColumnsProps): ColumnDef<StakeToken>[] => [
  {
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <ProtocolImage protocol={row.original.extensions.protocol} />
      </div>
    ),
    header: () => <Header text={t('protocol')} />,
    id: 'protocol',
    meta: { className: 'justify-start flex-grow-0', width: 150 },
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
    meta: { className: 'justify-start flex-grow-0', width: 120 },
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
    meta: { className: 'justify-start flex-grow-0', width: 100 },
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
            size="xSmall"
          >
            {t('stake.title')}
          </ButtonLink>
        </div>
      )
    },
    header: () => <Header text={t('stake.action')} />,
    id: 'action',
    meta: { className: 'justify-end', width: 80 },
  },
]

type Props = {
  data: StakeToken[]
  loading: boolean
}

export const StakeStrategyTable = function ({ data, loading }: Props) {
  const t = useTranslations('stake-page')

  const cols = useMemo(
    () =>
      stakeColumns({
        t,
      }),
    [t],
  )

  return (
    <div className="w-full text-sm font-medium">
      <div className="h-[56dvh] md:min-h-136">
        <Table
          columns={cols}
          containerClassName="flex h-full flex-col"
          data={data}
          loading={loading}
          priorityColumnIdsOnSmall={['action']}
        />
      </div>
    </div>
  )
}
