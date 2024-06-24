import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { evmRemoteNetworks, hemi } from 'app/networks'
import { hemiMainnet, hemiTestnet } from 'hemi-metadata'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useConnectedChainCrossChainMessenger } from 'hooks/useL2Bridge'
import PQueue from 'p-queue'
import { useContext } from 'react'
import { useAccount } from 'wagmi'

import { WithdrawOperation } from './types'

import { TunnelHistoryContext } from './index'

const queue = new PQueue({ concurrency: 3 })

// https://github.com/BVM-priv/ui-monorepo/issues/158
const l1ChainId = evmRemoteNetworks[0].id

const getMinutes = (minutes: number) => minutes * 60 * 1000

// use different refetch intervals depending on the status and chain
const refetchInterval = {
  [hemiMainnet.id]: {
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: false,
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: false,
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: getMinutes(1),
    [MessageStatus.READY_TO_PROVE]: getMinutes(1),
    [MessageStatus.IN_CHALLENGE_PERIOD]: getMinutes(3),
    [MessageStatus.READY_FOR_RELAY]: getMinutes(3),
    [MessageStatus.RELAYED]: false,
  },
  [hemiTestnet.id]: {
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: false,
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: false,
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: getMinutes(1),
    [MessageStatus.READY_TO_PROVE]: getMinutes(2),
    [MessageStatus.IN_CHALLENGE_PERIOD]: getMinutes(2),
    [MessageStatus.READY_FOR_RELAY]: getMinutes(2),
    [MessageStatus.RELAYED]: false,
  },
}

const updateWithdrawal = async ({
  crossChainMessenger,
  updateWithdrawalStatus,
  withdrawal,
}: {
  crossChainMessenger: CrossChainMessenger
  queryClient: QueryClient
  updateWithdrawalStatus: (w: WithdrawOperation, status: MessageStatus) => void
  withdrawal: WithdrawOperation
}) =>
  // Use a queue to avoid firing lots of requests. Throttling may also not work because it throttles
  // for a specific period of time and depending on load, requests may take up to 5 seconds to complete
  // so this let us to query up to <concurrency> checks for status at the same time
  queue.add(
    async function pollWithdrawalStatus() {
      const status = await crossChainMessenger.getMessageStatus(
        withdrawal.transactionHash,
        // default value
        0,
        withdrawal.direction,
      )
      if (withdrawal.status !== status) {
        updateWithdrawalStatus(withdrawal, status)
      }

      return status
    },
    {
      // Give more priority to those that require polling and are not ready
      // because if ready, after the operation they will change their status automatically and will have
      // the longest waiting period of all withdrawals, as the others have been waiting for longer
      priority: [
        MessageStatus.READY_TO_PROVE,
        MessageStatus.READY_FOR_RELAY,
      ].includes(withdrawal.status)
        ? 0
        : 1,
    },
  )

const WithdrawalStatusUpdater = function ({
  queryFn,
  withdrawal,
}: {
  queryFn: () => Promise<MessageStatus>
  withdrawal: WithdrawOperation
}) {
  useQuery({
    queryFn,
    queryKey: ['messageStatusUpdater', withdrawal.transactionHash],
    refetchInterval: refetchInterval[hemi.id][withdrawal.status],
  })

  return null
}

export const WithdrawalsStatusUpdater = function () {
  const { isConnected } = useAccount()
  const { updateWithdrawalStatus, withdrawals = [] } =
    useContext(TunnelHistoryContext)

  const unsupportedChain = useConnectedToUnsupportedEvmChain()

  const withdrawalsToWatch = withdrawals
    .filter(
      w =>
        // status never loaded
        !w.status ||
        // status needs watching
        [
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

  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  if (
    !isConnected ||
    crossChainMessengerStatus !== 'success' ||
    unsupportedChain
  ) {
    return null
  }

  return (
    <>
      {withdrawalsToWatch.map(w => (
        <WithdrawalStatusUpdater
          key={w.transactionHash}
          queryFn={() =>
            // @ts-expect-error unsure why it adds void, but actual result is not needed
            updateWithdrawal({
              crossChainMessenger,
              updateWithdrawalStatus,
              withdrawal: w,
            })
          }
          withdrawal={w}
        />
      ))}
    </>
  )
}
