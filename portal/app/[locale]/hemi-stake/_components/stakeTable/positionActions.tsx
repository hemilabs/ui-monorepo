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
  const position = row.original
  const { isTransferredPosition } = usePositionOwnership(position)
  const isWithdrawn = position.status === StakingPositionStatus.WITHDRAWN

  return (
    <div className="flex w-full flex-row-reverse items-center justify-end gap-x-2 lg:flex-row">
      <ClaimCta operation={position} />
      {(!isTransferredPosition || isWithdrawn) && (
        <UnlockCta operation={position} />
      )}
      {!isTransferredPosition && !isWithdrawn && (
        <ActionCell key={position.id} row={row} />
      )}
    </div>
  )
}
