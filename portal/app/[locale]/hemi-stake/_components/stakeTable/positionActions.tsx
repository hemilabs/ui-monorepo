import { Row } from '@tanstack/react-table'
import {
  type StakingPosition,
  StakingPositionStatus,
} from 'types/stakingDashboard'

import { usePositionOwnership } from '../../_hooks/usePositionOwnership'

import { ActionCell } from './actionCell'
import { ClaimCta } from './claimCta'
import { UnlockCta } from './unlockCta'

type Props = {
  row: Row<StakingPosition>
}

export function PositionActions({ row }: Props) {
  const { isTransferredPosition } = usePositionOwnership(row.original)

  return (
    <div className="flex w-full flex-row-reverse items-center justify-end gap-x-2 lg:flex-row">
      <ClaimCta operation={row.original} />
      {(!isTransferredPosition ||
        row.original.status === StakingPositionStatus.WITHDRAWN) && (
        <UnlockCta operation={row.original} />
      )}
      {!isTransferredPosition &&
        row.original.status !== StakingPositionStatus.WITHDRAWN && (
          <ActionCell key={row.original.id} row={row} />
        )}
    </div>
  )
}
