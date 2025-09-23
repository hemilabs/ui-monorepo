'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Card } from 'components/card'
import { ErrorBoundary } from 'components/errorBoundary'
import { Table } from 'components/table'
import { Header } from 'components/table/_components/header'
import { TxLink } from 'components/txLink'
import { useHemi } from 'hooks/useHemi'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo } from 'react'
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
    meta: { className: 'justify-end', width: '140px' },
  },
]

const Container = ({ children }: { children: ReactNode }) => (
  <div className="h-full bg-neutral-50 pb-1 md:px-1 [&>div]:h-full">
    <Card>{children}</Card>
  </div>
)

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

  const getContent = function () {
    if (!walletIsConnected(status)) {
      return (
        <Container>
          <ConnectWallet />
        </Container>
      )
    }

    if (status === 'connecting') {
      return (
        <Container>
          <Skeleton className="h-[calc(100%-3px)] w-full rounded-xl" />
        </Container>
      )
    }

    if (!connectedToHemi) {
      return (
        <Container>
          <UnsupportedChain />
        </Container>
      )
    }

    if (isEmpty) {
      return (
        <Container>
          <NoPositionStaked />
        </Container>
      )
    }

    return (
      <Table
        columns={cols}
        data={data}
        loading={loading}
        priorityColumnIdsOnSmall={['time-remaining']}
        smallBreakpoint={1024}
      />
    )
  }

  return (
    <div className="w-full rounded-xl bg-neutral-100 text-sm font-medium">
      <div className="md:min-h-128 h-[53dvh] overflow-hidden">
        {getContent()}
      </div>
    </div>
  )
}
