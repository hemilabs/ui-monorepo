'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ButtonLink } from 'components/button'
import { Table } from 'components/table'
import { Header } from 'components/table/_components/header'
import { TokenLogo } from 'components/tokenLogo'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useUmami } from 'hooks/useUmami'
import { useRouter } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import { MouseEvent, useCallback, useMemo } from 'react'
import { priorityStakeTokensToSort, StakeToken } from 'types/stake'
import { sortTokens } from 'utils/sortTokens'
import { queryStringObjectToString } from 'utils/url'

import { ProtocolImage } from '../../../_components/protocolImage'
import { StakedBalance } from '../../../_components/stakedBalance'
import { StakedBalanceUsd } from '../../../_components/stakedBalanceUsd'
import { TokenBalance } from '../../../_components/tokenBalance'
import { TokenRewards } from '../../../_components/tokenRewards'
import { useDrawerStakeQueryString } from '../../../_hooks/useDrawerStakeQueryString'
import { useStakePositions } from '../../../_hooks/useStakedBalance'

import { WelcomeStake } from './welcomeStake'

type ActionProps = {
  stake: StakeToken
}

const CallToAction = function ({ stake }: ActionProps) {
  const pathname = usePathnameWithoutLocale()

  const queryString = queryStringObjectToString({
    mode: 'manage',
    tokenAddress: stake.address,
  })

  return (
    <ButtonLink
      href={`${pathname}${queryString}`}
      onClick={function (e) {
        // prevent full navigation - we want a shallow navigation to open the drawer
        e.preventDefault()
        // navigation is done in event delegation, in the row
      }}
      size="xSmall"
      variant="tertiary"
    >
      <span className="text-lg font-normal text-neutral-500 transition duration-300 hover:text-neutral-950">
        ···
      </span>
    </ButtonLink>
  )
}

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
    header: () => <Header text={t('action')} />,
    id: 'action',
    meta: { className: 'justify-end', width: '75px' },
  },
]

export const StakeAssetsTable = function () {
  const t = useTranslations('stake-page')
  const { loading: isLoadingBalance, tokensWithPosition } = useStakePositions()
  const { setDrawerQueryString } = useDrawerStakeQueryString()
  const router = useRouter()
  const [networkType] = useNetworkType()
  const { track } = useUmami()

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
        ? sortTokens<StakeToken>({
            prices,
            prioritySymbols: priorityStakeTokensToSort,
            tokens: tokensWithPosition,
          })
        : [],
    [isLoading, errorUpdateCount, tokensWithPosition, prices],
  )

  const stakeMoreUrl = 'stake'
  function goToStakePage(e: MouseEvent<HTMLAnchorElement>) {
    track?.('stake - stake more')
    // If the user is trying to open the link in a new tab or window, let the browser handle it
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    const queryString = queryStringObjectToString({ networkType })
    router.push(`/${stakeMoreUrl}${queryString}`)
  }

  const handleRowClick = useCallback(
    (token: StakeToken) => setDrawerQueryString('manage', token.address),
    [setDrawerQueryString],
  )

  const cols = useMemo(() => stakeColumns({ t }), [t])

  return (
    <div className="w-full rounded-xl text-sm font-medium">
      <div className="md:min-h-136 h-[56dvh] overflow-hidden">
        <Table
          columns={cols}
          data={sortedTokens}
          loading={isLoading}
          onRowClick={handleRowClick}
          placeholder={
            tokensWithPosition.length === 0 && (
              <WelcomeStake href={`/${stakeMoreUrl}`} onClick={goToStakePage} />
            )
          }
          priorityColumnIdsOnSmall={['action']}
          smallBreakpoint={1024}
        />
      </div>
    </div>
  )
}
