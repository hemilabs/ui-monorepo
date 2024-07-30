import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { evmRemoteNetworks, hemi } from 'app/networks'
import { hemi as hemiMainnet, hemiSepolia as hemiTestnet } from 'hemi-viem'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useConnectedChainCrossChainMessenger } from 'hooks/useL2Bridge'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import PQueue from 'p-queue'
import { useAccount } from 'wagmi'

import { getBlock, getTransactionReceipt } from './operations'
import { EvmWithdrawOperation } from './types'

const queue = new PQueue({ concurrency: 3 })

// https://github.com/BVM-priv/ui-monorepo/issues/158
const l1ChainId = evmRemoteNetworks[0].id

const getSeconds = (seconds: number) => seconds * 1000
const getMinutes = (minutes: number) => getSeconds(minutes * 60)

// use different refetch intervals depending on the status and chain
const refetchInterval = {
  [hemiMainnet.id]: {
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: getSeconds(12),
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: false,
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: getMinutes(1),
    [MessageStatus.READY_TO_PROVE]: getMinutes(1),
    [MessageStatus.IN_CHALLENGE_PERIOD]: getMinutes(3),
    [MessageStatus.READY_FOR_RELAY]: getMinutes(3),
    [MessageStatus.RELAYED]: false,
  },
  [hemiTestnet.id]: {
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: getSeconds(12),
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: false,
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: getMinutes(1),
    [MessageStatus.READY_TO_PROVE]: getMinutes(2),
    [MessageStatus.IN_CHALLENGE_PERIOD]: getMinutes(2),
    [MessageStatus.READY_FOR_RELAY]: getMinutes(2),
    [MessageStatus.RELAYED]: false,
  },
} satisfies { [chainId: number]: { [status: number]: number | false } }

const getBlockTimestamp = (withdrawal: EvmWithdrawOperation) =>
  async function (
    blockNumber: number | undefined,
  ): Promise<[number?, number?]> {
    if (blockNumber === undefined) {
      return []
    }
    if (withdrawal.timestamp) {
      return [blockNumber, withdrawal.timestamp]
    }
    const { timestamp } = await getBlock(blockNumber, hemi.id)
    return [blockNumber, Number(timestamp)]
  }

const getTransactionBlockNumber = function (withdrawal: EvmWithdrawOperation) {
  if (withdrawal.blockNumber) {
    return Promise.resolve(withdrawal.blockNumber)
  }
  return getTransactionReceipt(withdrawal.transactionHash, hemi.id).then(
    transactionReceipt =>
      // return undefined if TX is not found - might have not been confirmed yet
      transactionReceipt ? Number(transactionReceipt.blockNumber) : undefined,
  )
}

const pollUpdateWithdrawal = async ({
  crossChainMessenger,
  updateWithdrawal,
  withdrawal,
}: {
  crossChainMessenger: CrossChainMessenger
  queryClient: QueryClient
  updateWithdrawal: (
    w: EvmWithdrawOperation,
    updates: Partial<EvmWithdrawOperation>,
  ) => void
  withdrawal: EvmWithdrawOperation
}) =>
  // Use a queue to avoid firing lots of requests. Throttling may also not work because it throttles
  // for a specific period of time and depending on load, requests may take up to 5 seconds to complete
  // so this let us to query up to <concurrency> checks for status at the same time
  queue.add(
    async function pollWithdrawalState() {
      const [status, [blockNumber, timestamp]] = await Promise.all([
        crossChainMessenger.getMessageStatus(
          withdrawal.transactionHash,
          // default value
          0,
          withdrawal.direction,
        ),
        getTransactionBlockNumber(withdrawal).then(
          getBlockTimestamp(withdrawal),
        ),
      ])
      const changes: Partial<EvmWithdrawOperation> = {}
      if (withdrawal.status !== status) {
        changes.status = status
      }
      if (withdrawal.blockNumber !== blockNumber) {
        changes.blockNumber = blockNumber
      }
      if (withdrawal.timestamp !== timestamp) {
        changes.timestamp = timestamp
      }

      if (Object.keys(changes).length > 0) {
        updateWithdrawal(withdrawal, changes)
      }

      return status
    },
    {
      // Give more priority to those that require polling and are not ready or are missing information
      // because if ready, after the operation they will change their status automatically and will have
      // the longest waiting period of all withdrawals, as the others have been waiting for longer
      priority:
        !withdrawal.timestamp ||
        [MessageStatus.READY_TO_PROVE, MessageStatus.READY_FOR_RELAY].includes(
          withdrawal.status,
        )
          ? 0
          : 1,
    },
  )

const WatchEvmWithdrawal = function ({
  queryFn,
  withdrawal,
}: {
  queryFn: () => Promise<MessageStatus>
  withdrawal: EvmWithdrawOperation
}) {
  // This is a hacky usage of useQuery. I am using it this way because it provides automatic refetching,
  // request deduping, and conditional refetch depending on the state of the withdrawal.
  // I am not interested in the actual result of the query, but in the side effect of the queryFn
  useQuery({
    queryFn,
    queryKey: [
      'withdrawaStateUpdater',
      withdrawal.chainId,
      withdrawal.transactionHash,
    ],
    refetchInterval: refetchInterval[hemi.id][withdrawal.status],
  })

  return null
}

export const WithdrawalsStateUpdater = function () {
  const { isConnected } = useAccount()
  const { updateWithdrawal, withdrawals = [] } = useTunnelHistory()

  const unsupportedChain = useConnectedToUnsupportedEvmChain()

  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  if (
    !isConnected ||
    crossChainMessengerStatus !== 'success' ||
    unsupportedChain
  ) {
    return null
  }

  const withdrawalsToWatch = withdrawals
    .filter(
      w =>
        !w.timestamp ||
        [
          MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE,
          MessageStatus.STATE_ROOT_NOT_PUBLISHED,
          MessageStatus.READY_TO_PROVE,
          MessageStatus.IN_CHALLENGE_PERIOD,
          MessageStatus.READY_FOR_RELAY,
        ].includes(w.status),
    )
    // put those undefined statuses first
    // but then sorted by timestamp (newest first)
    .sort(function (a, b) {
      if (a.status === b.status) {
        return b.timestamp - a.timestamp
      }
      return (a.status ?? -1) - (b.status ?? -1)
    })

  return (
    <>
      {withdrawalsToWatch.map(w => (
        <WatchEvmWithdrawal
          key={w.transactionHash}
          queryFn={() =>
            // @ts-expect-error unsure why it adds void, but actual result is not needed
            pollUpdateWithdrawal({
              crossChainMessenger,
              updateWithdrawal,
              withdrawal: w,
            })
          }
          withdrawal={w}
        />
      ))}
    </>
  )
}
