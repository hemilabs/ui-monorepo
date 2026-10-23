import { StakingPositionStatus } from 'types/stakingDashboard'
import { getLockedPositions } from 'utils/subgraph'
import { getAutoRelockStatus } from 've-hemi-actions/actions'
import { type Address, type Chain, type Client } from 'viem'

export const fetchStakingPositions = async function ({
  address,
  chainId,
  hemiClient,
}: {
  address: Address
  chainId: Chain['id']
  hemiClient: Client
}) {
  const positions = await getLockedPositions({ address, chainId })

  const activeTokenIds = positions
    .filter(({ status }) => status === StakingPositionStatus.ACTIVE)
    .map(({ tokenId }) => tokenId)

  const statuses =
    activeTokenIds.length > 0
      ? await getAutoRelockStatus(hemiClient, activeTokenIds)
      : []

  const statusByTokenId = new Map(
    activeTokenIds.map((tokenId, index) => [tokenId, statuses[index]]),
  )

  return positions.map(function (position) {
    const status = statusByTokenId.get(position.tokenId)
    const effectiveLockEnd = status?.effectiveLockEnd

    return {
      ...position,
      autoRelock: status?.isAutoRelockEnabled ?? false,
      effectiveLockEnd:
        effectiveLockEnd === BigInt(0) ? undefined : effectiveLockEnd,
    }
  })
}
