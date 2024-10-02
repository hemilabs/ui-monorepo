import { MessageStatus } from '@eth-optimism/sdk'
import { useQuery } from '@tanstack/react-query'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useHemi } from 'hooks/useHemi'
import { useConnectedChainCrossChainMessenger } from 'hooks/useL2Bridge'
import { useNetworks } from 'hooks/useNetworks'
import { useToEvmWithdrawals } from 'hooks/useToEvmWithdrawals'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import PQueue from 'p-queue'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { CrossChainMessengerProxy } from 'utils/crossChainMessenger'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { type Chain } from 'viem'
import { useAccount } from 'wagmi'

const queue = new PQueue({ concurrency: 2 })

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

const getBlockTimestamp = (withdrawal: ToEvmWithdrawOperation, hemi: Chain) =>
  async function (
    blockNumber: number | undefined,
  ): Promise<[number?, number?]> {
    if (blockNumber === undefined) {
      return []
    }
    if (withdrawal.timestamp) {
      return [blockNumber, withdrawal.timestamp]
    }
    const { timestamp } = await getEvmBlock(
      blockNumber,
      // See https://github.com/hemilabs/ui-monorepo/issues/376
      withdrawal.l2ChainId ?? hemi.id,
    )
    return [blockNumber, Number(timestamp)]
  }

const getTransactionBlockNumber = function (
  withdrawal: ToEvmWithdrawOperation,
) {
  if (withdrawal.blockNumber) {
    return Promise.resolve(withdrawal.blockNumber)
  }
  return getEvmTransactionReceipt(
    withdrawal.transactionHash,
    withdrawal.l2ChainId,
  ).then(transactionReceipt =>
    // return undefined if TX is not found - might have not been confirmed yet
    transactionReceipt ? Number(transactionReceipt.blockNumber) : undefined,
  )
}

const pollUpdateWithdrawal = async ({
  crossChainMessenger,
  hemi,
  updateWithdrawal,
  withdrawal,
}: {
  crossChainMessenger: CrossChainMessengerProxy
  hemi: Chain
  updateWithdrawal: (
    w: ToEvmWithdrawOperation,
    updates: Partial<ToEvmWithdrawOperation>,
  ) => void
  withdrawal: ToEvmWithdrawOperation
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
          getBlockTimestamp(withdrawal, hemi),
        ),
      ])
      const changes: Partial<ToEvmWithdrawOperation> = {}
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
        withdrawal.status === undefined ||
        [MessageStatus.READY_TO_PROVE, MessageStatus.READY_FOR_RELAY].includes(
          withdrawal.status,
        )
          ? 0
          : 1,
    },
  )

const WatchEvmWithdrawal = function ({
  withdrawal,
}: {
  withdrawal: ToEvmWithdrawOperation
}) {
  const { evmRemoteNetworks } = useNetworks()
  // See https://github.com/hemilabs/ui-monorepo/issues/158
  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(evmRemoteNetworks[0].id)
  const { updateWithdrawal } = useTunnelHistory()

  const hemi = useHemi()
  // This is a hacky usage of useQuery. I am using it this way because it provides automatic refetching,
  // request deduping, and conditional refetch depending on the state of the withdrawal.
  // I am not interested in the actual result of the query, but in the side effect of the queryFn
  useQuery({
    enabled: crossChainMessengerStatus === 'success',
    queryFn: () =>
      pollUpdateWithdrawal({
        crossChainMessenger,
        hemi,
        updateWithdrawal,
        withdrawal,
      }),
    queryKey: [
      'withdrawaStateUpdater',
      // See https://github.com/hemilabs/ui-monorepo/issues/376
      withdrawal.l2ChainId ?? hemi.id,
      withdrawal.transactionHash,
    ],
    refetchInterval:
      refetchInterval[withdrawal.l2ChainId ?? hemi.id][withdrawal.status],
  })

  return null
}

export const WithdrawalsStateUpdater = function () {
  const { isConnected } = useAccount()
  const withdrawals = useToEvmWithdrawals()

  const unsupportedChain = useConnectedToUnsupportedEvmChain()

  if (!isConnected || unsupportedChain) {
    return null
  }

  const withdrawalsToWatch = withdrawals
    .filter(
      w =>
        !w.timestamp ||
        w.status === undefined ||
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
        <WatchEvmWithdrawal key={w.transactionHash} withdrawal={w} />
      ))}
    </>
  )
}
