'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ButtonLink } from 'components/button'
import { Balance } from 'components/cryptoBalance'
import { ExternalLink } from 'components/externalLink'
import { FiatBalance } from 'components/fiatBalance'
import { Table } from 'components/table'
import { Header } from 'components/table/_components/header'
import { TokenLogo } from 'components/tokenLogo'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { MouseEvent, useMemo } from 'react'
import { StakeToken } from 'types/stake'

import { useDrawerStakeQueryString } from '../../_hooks/useDrawerStakeQueryString'
import { ProtocolImage } from '../protocolImage'
import { TokenBalance } from '../tokenBalance'
import { TokenRewards } from '../tokenRewards'

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
    meta: { width: '300px' },
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
    meta: { width: '80px' },
  },
]

type Props = {
  data: StakeToken[]
  loading: boolean
}

export const StakeStrategyTable = function ({ data, loading }: Props) {
  const t = useTranslations('stake-page')
  const { track } = useUmami()

  const learnHowToStakeLink =
    'https://docs.hemi.xyz/how-to-tutorials/using-hemi/stake'

  const trackLinkClick = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    e.stopPropagation()
    track?.('stake - learn stake')
    window.open(learnHowToStakeLink, '_blank')
  }

  const cols = useMemo(
    () =>
      stakeColumns({
        t,
      }),
    [t],
  )

  return (
    <div className="w-full rounded-xl text-sm font-medium">
      <div className="md:min-h-136 h-[56dvh] overflow-hidden">
        <Table
          columns={cols}
          data={data}
          loading={loading}
          priorityColumnIdsOnSmall={['action']}
          smallBreakpoint={1024}
        />
      </div>
      <p className="ml-2 mt-2.5 flex font-normal text-neutral-600">
        {t('stake.new-here')}
        <ExternalLink href={learnHowToStakeLink} onClick={trackLinkClick}>
          <span className="hoverable-text ml-1">
            {t('stake.learn-how-to-stake-on-hemi')}
          </span>
        </ExternalLink>
      </p>
    </div>
  )
}
