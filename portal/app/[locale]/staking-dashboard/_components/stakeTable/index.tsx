'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Card } from 'components/card'
import { ErrorBoundary } from 'components/errorBoundary'
import { Table } from 'components/table'
import { Header } from 'components/table/_components/header'
import { useHemi } from 'hooks/useHemi'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type StakingPosition } from 'types/stakingDashboard'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { calculateVotingPower } from '../../_utils/lockCreationTimes'
import { Amount } from '../amount'

import { ActionCell } from './actionCell'
import { ConnectWallet } from './connectWallet'
import { LockupTime } from './lockupTime'
import { NoPositionStaked } from './noPositionStaked'
import { TimeRemaining } from './timeRemaining'
import { UnsupportedChain } from './unsupportedChain'
import { VotingPower } from './votingPower'

type StakingColumnsProps = {
  t: ReturnType<typeof useTranslations<'staking-dashboard'>>
  openRowId: string | null
  setOpenRowId: (id: string | null) => void
}

const stakingColumns = ({
  openRowId,
  setOpenRowId,
  t,
}: StakingColumnsProps): ColumnDef<StakingPosition>[] => [
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
    header: () => <Header text={t('table.locked-amount')} />,
    id: 'locked-amount',
    meta: { width: '170px' },
  },
  {
    cell({ row }) {
      const { amount, lockTime, timestamp } = row.original
      const { percentageOfMax, votingPower } = calculateVotingPower({
        amount,
        lockTime,
        timestamp,
      })
      return (
        <div className="flex items-center justify-center gap-x-2">
          <VotingPower
            percentageOfMax={percentageOfMax}
            votingPower={votingPower}
          />
        </div>
      )
    },
    header: () => <Header text={t('voting-power')} />,
    id: 'voting-power',
    meta: { width: '150px' },
  },
  {
    cell: ({ row }) => (
      <ErrorBoundary
        fallback={<span className="text-sm text-neutral-950">-</span>}
      >
        <LockupTime lockupTime={row.original.lockTime} />
      </ErrorBoundary>
    ),
    header: () => <Header text={t('table.lockup')} />,
    id: 'lockup',
    meta: { width: '200px' },
  },
  {
    cell: ({ row }) => <TimeRemaining operation={row.original} />,
    header: () => <Header text={t('table.time-remaining')} />,
    id: 'time-remaining',
    meta: { className: 'justify-end', width: '140px' },
  },
  {
    cell: ({ row }) => (
      <ActionCell openRowId={openRowId} row={row} setOpenRowId={setOpenRowId} />
    ),
    id: 'action',
    meta: { width: '60px' },
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
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const { status } = useAccount()
  const hemi = useHemi()
  const connectedToHemi = useIsConnectedToExpectedNetwork(hemi.id)

  const isEmpty = (data?.length ?? 0) === 0 && !loading

  const cols = useMemo(
    () =>
      stakingColumns({
        openRowId,
        setOpenRowId,
        t,
      }),
    [openRowId, setOpenRowId, t],
  )

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
        priorityColumnIdsOnSmall={['action', 'time-remaining']}
        smallBreakpoint={1024}
      />
    )
  }

  return (
    <div className="w-full rounded-xl bg-neutral-100 text-sm font-medium">
      <div className="md:min-h-136 h-[56dvh] overflow-hidden">
        {getContent()}
      </div>
    </div>
  )
}
