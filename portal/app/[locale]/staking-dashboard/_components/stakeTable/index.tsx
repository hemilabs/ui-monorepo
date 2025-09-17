'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ErrorBoundary } from 'components/errorBoundary'
import { Table } from 'components/table'
import { Header } from 'components/table/table'
import { TxLink } from 'components/txLink'
import { useHemi } from 'hooks/useHemi'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { StakingPosition } from 'types/stakingDashboard'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { Amount } from '../amount'

import { ConnectWallet } from './connectWallet'
import { LockupTime } from './lockupTime'
import { NoPositionStaked } from './noPositionStaked'
import { TimeRemaining } from './timeRemaining'
import { UnsupportedChain } from './unsupportedChain'

const stakingColumns = (
  t: ReturnType<typeof useTranslations<'staking-dashboard'>>,
): ColumnDef<StakingPosition>[] => [
  {
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-x-2">
        <ErrorBoundary
          fallback={<span className="text-sm text-neutral-950">-</span>}
        >
          <Amount operation={row.original} />
        </ErrorBoundary>
      </div>
    ),
    header: () => <Header text={t('amount')} />,
    id: 'amount',
    meta: { width: '150px' },
  },
  {
    cell: function ExplorerLink({ row }) {
      const hemi = useHemi()
      return (
        <div className="flex items-center">
          <TxLink chainId={hemi.id} txHash={row.original.transactionHash} />
        </div>
      )
    },
    header: () => <Header text={t('table.tx')} />,
    id: 'tx',
    meta: { width: '130px' },
  },
  {
    cell: ({ row }) => (
      <ErrorBoundary
        fallback={<span className="text-sm text-neutral-950">-</span>}
      >
        <LockupTime lockupTime={row.original.lockTime} />
      </ErrorBoundary>
    ),
    header: () => <Header text={t('lockup-period')} />,
    id: 'lockup-period',
    meta: { width: '230px' },
  },
  {
    cell: ({ row }) => <TimeRemaining operation={row.original} />,
    header: () => <Header text={t('table.time-remaining')} />,
    id: 'time-remaining',
    meta: { className: 'justify-end', width: '130px' },
  },
]

type Props = {
  data: StakingPosition[] | undefined
  loading: boolean
}

export function StakeTable({ data, loading }: Props) {
  const t = useTranslations('staking-dashboard')
  const { status } = useAccount()
  const hemi = useHemi()
  const connectedToHemi = useIsConnectedToExpectedNetwork(hemi.id)

  const isEmpty = (data?.length ?? 0) === 0 && !loading

  const cols = useMemo(() => stakingColumns(t), [t])

  if (!walletIsConnected(status)) {
    return <ConnectWallet />
  }

  if (status === 'connecting') {
    return <Skeleton className="h-[calc(100%-3px)] w-full rounded-xl" />
  }

  if (!connectedToHemi) {
    return <UnsupportedChain />
  }

  if (isEmpty) {
    return <NoPositionStaked />
  }

  return (
    <div className="h-[53dvh] overflow-hidden md:min-h-[53dvh]">
      <Table<StakingPosition>
        columns={cols}
        data={data}
        getRowKey={(row, i) => row?.transactionHash ?? String(i)}
        loading={loading}
        priorityColumnIdsOnSmall={['time-remaining']}
        smallBreakpoint={1024}
      />
    </div>
  )
}
