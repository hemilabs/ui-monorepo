import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import {
  getEpochRewardsAddress,
  getEpochRewardsStartBlock,
  getRewardsGeneration,
} from 'utils/veHemiEpochRewards'
import { findDeployBlock, getClaimedHistory } from 've-hemi-rewards/actions'
import { getBlockNumber } from 'viem/actions'
import { useAccount } from 'wagmi'

/**
 * The block to read `Claimed` logs from.
 *
 * A configured value wins; otherwise the contract's deploy block is found by bisecting
 * `getCode`, which costs ~23 cheap calls once per session. That keeps a scenario devnet
 * working with the two addresses a developer already pastes, and lets a real deployment
 * pin an exact block instead.
 *
 * Endpoints that do not serve historical `getCode` make this fail, and the history is
 * then simply not shown - better than a total that silently starts part-way through.
 */
const useEpochRewardsStartBlock = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const rewardsAddress = getEpochRewardsAddress(chainId)
  const configured = getEpochRewardsStartBlock(chainId)

  return useQuery({
    enabled: !!rewardsAddress && getRewardsGeneration(chainId) === 'epoch',
    // A deployed contract's first block never moves.
    gcTime: Number.POSITIVE_INFINITY,
    queryFn: () =>
      configured ?? findDeployBlock(hemiClient, { address: rewardsAddress! }),
    queryKey: ['epochRewardsStartBlock', chainId, rewardsAddress],
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export const getClaimedHistoryQueryKeyPrefix = ({
  chainId,
  holder,
}: {
  chainId: number
  holder?: string
}) => ['epochClaimedHistory', chainId, holder]

/**
 * Every reward this wallet has already been paid, across all of its positions.
 *
 * One query for the whole wallet rather than one per position: a single `getLogs` filtered
 * on the holder topic answers for all of them, and the per-position figures are selected
 * out of it.
 *
 * Scoped to the connected wallet. A position can pay several holders over its life, and
 * the previous owner's rewards are not this wallet's history.
 */
export const useClaimedHistory = function () {
  const { address } = useAccount()
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const rewardsAddress = getEpochRewardsAddress(chainId)
  const { data: startBlock, isError: isStartBlockError } =
    useEpochRewardsStartBlock()

  const query = useQuery({
    enabled: !!address && !!rewardsAddress && startBlock !== undefined,
    queryFn: async () =>
      getClaimedHistory(hemiClient, {
        fromBlock: startBlock!,
        holder: address!,
        rewardsAddress: rewardsAddress!,
        // Read here rather than keyed on: keying on the head block would refetch the
        // whole history on every new block.
        toBlock: await getBlockNumber(hemiClient),
      }),
    queryKey: [
      ...getClaimedHistoryQueryKeyPrefix({ chainId, holder: address }),
      startBlock?.toString(),
    ],
    // Only a claim moves this, and a claim invalidates it explicitly.
    staleTime: 5 * 60 * 1000,
  })

  return {
    ...query,
    // A start block that could not be found is not a pending history - nothing further
    // is coming, and the caller shows no history rather than waiting for one.
    isError: query.isError || isStartBlockError,
  }
}
