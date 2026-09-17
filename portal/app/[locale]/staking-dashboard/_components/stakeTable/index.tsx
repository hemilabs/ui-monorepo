import { ColumnDef } from '@tanstack/react-table'
import { ErrorBoundary } from 'components/errorBoundary'
import { Table } from 'components/table'
import { Header } from 'components/table/_components/header'
import { TableCard } from 'components/table/tableCard'
import { useHemi } from 'hooks/useHemi'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type StakingPosition } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { Amount } from '../amount'
import { RewardsDisplay } from '../rewardsDisplay'

import { ActionCell } from './actionCell'
import { ConnectWallet } from './connectWallet'
import { LockupTime } from './lockupTime'
import { NoPositionStaked } from './noPositionStaked'
import { PositionsUnavailable } from './positionsUnavailable'
import { type StakeTableFilterOptions } from './stakeTableFilter'
import { UnlockCta } from './unlockCta'
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
    meta: { width: 180 },
  },
  {
    cell({ row }) {
      const { lockTime, status, tokenId } = row.original
      return (
        <ErrorBoundary
          fallback={<span className="text-sm text-neutral-950">-</span>}
        >
          <LockupTime lockupTime={lockTime} status={status} tokenId={tokenId} />
        </ErrorBoundary>
      )
    },
    header: () => <Header text={t('table.lockup')} />,
    id: 'lockup',
    meta: { width: 80 },
  },
  {
    cell({ row }) {
      const { amount, tokenId } = row.original
      return (
        <div className="flex items-center justify-center gap-x-2">
          <VotingPower amount={amount} tokenId={tokenId} />
        </div>
      )
    },
    header: () => <Header text={t('voting-power')} />,
    id: 'voting-power',
    meta: { width: 110 },
  },
  {
    cell: ({ row }) => <RewardsDisplay tokenId={row.original.tokenId} />,
    header: () => <Header text={t('table.rewards')} />,
    id: 'rewards',
    meta: { width: 95 },
  },
  {
    cell: ({ row }) => (
      <div className="flex w-full flex-row-reverse items-center justify-end gap-x-2 lg:flex-row">
        <UnlockCta operation={row.original} />
        <ActionCell
          openRowId={openRowId}
          row={row}
          setOpenRowId={setOpenRowId}
        />
      </div>
    ),
    header: () => <Header text={t('table.action')} />,
    id: 'action',
    meta: { className: 'justify-start lg:justify-end', width: 280 },
  },
]

type Props = {
  data: StakingPosition[] | undefined
  // Kept apart from an empty list, which is a claim about the wallet, not the request.
  hasError?: boolean
  loading: boolean
  filter?: StakeTableFilterOptions
}

export function StakeTable({
  data,
  filter = 'active',
  hasError = false,
  loading,
}: Props) {
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
        <TableCard>
          <ConnectWallet />
        </TableCard>
      )
    }

    if (status === 'connecting') {
      return (
        <TableCard>
          <Skeleton
            className="block size-full rounded-lg"
            containerClassName="block h-full"
          />
        </TableCard>
      )
    }

    if (!connectedToHemi) {
      return (
        <TableCard>
          <UnsupportedChain />
        </TableCard>
      )
    }

    // Only when there is nothing else to show: a background refetch can fail while the
    // previous positions are still on screen, and blanking a populated table would be
    // worse than the problem this branch was added for.
    if (hasError && (data?.length ?? 0) === 0) {
      return (
        <TableCard>
          <PositionsUnavailable />
        </TableCard>
      )
    }

    if (isEmpty) {
      return (
        <TableCard>
          <NoPositionStaked filter={filter} />
        </TableCard>
      )
    }

    return (
      <Table
        columns={cols}
        containerClassName="flex h-full flex-col"
        data={data}
        fitContainer
        loading={loading}
        priorityColumnIdsOnSmall={['action']}
      />
    )
  }

  return (
    <div className="w-full text-sm font-medium">
      <div className="h-[56dvh] md:min-h-136">{getContent()}</div>
    </div>
  )
}
