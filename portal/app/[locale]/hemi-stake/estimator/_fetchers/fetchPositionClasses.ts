import { type StakingPosition } from 'types/stakingDashboard'
import { getTransferableAfter } from 've-hemi-actions/actions'
import { type Client } from 'viem'

import { alwaysTransferable } from '../../_utils/rewardClass'

export const fetchPositionClasses = async function (
  client: Client,
  { positions }: { positions: StakingPosition[] },
) {
  const pending = positions.filter(position => !position.transferable)
  const instants = pending.length
    ? await getTransferableAfter(
        client,
        pending.map(position => position.tokenId),
      )
    : []

  const instantByToken = new Map(
    pending.map((position, index) => [position.tokenId, instants[index]]),
  )

  return Object.fromEntries(
    positions.map(position => [
      position.tokenId.toString(),
      position.transferable
        ? alwaysTransferable
        : {
            forfeitable: position.forfeitable,
            transferableAfter: Number(instantByToken.get(position.tokenId)),
          },
    ]),
  )
}
