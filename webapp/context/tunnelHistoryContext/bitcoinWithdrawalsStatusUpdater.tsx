import { useQuery } from '@tanstack/react-query'
import { useBtcWithdrawals } from 'hooks/useBtcWithdrawals'
import { useHemiClient } from 'hooks/useHemiClient'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import PQueue from 'p-queue'
import { BtcWithdrawStatus, ToBtcWithdrawOperation } from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import {
  getBitcoinWithdrawalBitcoinTxId,
  getBitcoinWithdrawalGracePeriod,
  getBitcoinWithdrawalUuid,
} from 'utils/hemi'
import { zeroAddress } from 'viem'

const hemiQueue = new PQueue({ concurrency: 2 })

// This UI-less component queries the Hemi blockchain looking for updates on the
// transaction status.
function WatchInitiatedBitcoinWithdrawal({
  withdrawal,
}: {
  withdrawal: ToBtcWithdrawOperation
}) {
  const hemiClient = useHemiClient()
  const { updateWithdrawal } = useTunnelHistory()

  async function updateWithdrawalDataAndStatus() {
    // When a withdrawal is just initiated, the status of that tx shall be
    // monitored. If confirmed, a timestamp will be available through the
    // block and the status must be updated in the tunnel history. The UUID can
    // also be added here if missing by reading it from the receipt logs.
    if (withdrawal.status === BtcWithdrawStatus.TX_PENDING) {
      const receipt = await getEvmTransactionReceipt(
        withdrawal.transactionHash,
        withdrawal.l2ChainId,
      )
      if (!receipt) {
        return false
      }

      const updates: Partial<ToBtcWithdrawOperation> = {}
      updates.status =
        receipt.status === 'success'
          ? BtcWithdrawStatus.TX_CONFIRMED
          : BtcWithdrawStatus.WITHDRAWAL_FAILED

      if (!withdrawal.uuid) {
        updates.uuid = getBitcoinWithdrawalUuid(
          // @ts-expect-error wagmi seems to be wrongly typed
          receipt,
        ).toString()
      }

      if (!withdrawal.timestamp) {
        const block = await getEvmBlock(
          receipt.blockNumber,
          withdrawal.l2ChainId,
        )
        updates.timestamp = Number(block.timestamp)
      }

      updateWithdrawal(withdrawal, updates)
      return true
    }

    // If the initiation succeeded, the BTC transaction must be monitored. If
    // present, move it to WITHDRAWAL_SUCCEEDED but if not and the withdrawal is
    // more than 12 hours old, move it to CHALLENGE_READY.
    if (withdrawal.status === BtcWithdrawStatus.TX_CONFIRMED) {
      const vaultIndex = await hemiClient.getVaultChildIndex()
      const bitcoinTxId = await getBitcoinWithdrawalBitcoinTxId({
        hemiClient,
        uuid: BigInt(withdrawal.uuid),
        vaultIndex,
      })
      if (bitcoinTxId !== zeroAddress) {
        updateWithdrawal(withdrawal, {
          status: BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED,
        })
        return true
      }

      const gracePeriod = await getBitcoinWithdrawalGracePeriod({
        hemiClient,
        vaultIndex,
      })
      const age = Math.floor(new Date().getTime() / 1000) - withdrawal.timestamp
      if (age > gracePeriod) {
        updateWithdrawal(withdrawal, {
          status: BtcWithdrawStatus.CHALLENGE_READY,
        })
        return true
      }

      return false
    }

    // If the challenging period started, the challenge tx must be monitored. If
    // there is one, the state must be changed to IN_PROGRESS.
    if (withdrawal.status === BtcWithdrawStatus.CHALLENGE_READY) {
      if (!withdrawal.challengeTxHash) {
        return false
      }

      updateWithdrawal(withdrawal, {
        status: BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
      })
      return true
    }

    // While the challenge is in progress, if the tx succeeds, the withdrawal is
    // terminated. Otherwise it can be retried.
    if (withdrawal.status === BtcWithdrawStatus.CHALLENGE_IN_PROGRESS) {
      const receipt = await getEvmTransactionReceipt(
        withdrawal.challengeTxHash,
        withdrawal.l2ChainId,
      )
      if (!receipt) {
        return false
      }

      updateWithdrawal(withdrawal, {
        status:
          receipt.status === 'success'
            ? BtcWithdrawStatus.WITHDRAWAL_FAILED
            : BtcWithdrawStatus.CHALLENGE_READY,
      })
      return true
    }

    // Should never reach this line so let's throw just in case.
    throw new Error(`Unknown withdrawal state: ${withdrawal.status}`)
  }

  const queryFn = () => hemiQueue.add(updateWithdrawalDataAndStatus)
  const queryKey = [
    'btc-withdrawal-data-and-status',
    withdrawal.l2ChainId,
    withdrawal.transactionHash,
  ]
  useQuery({ queryFn, queryKey, refetchInterval: 15 * 1000 })

  return null
}

// This component has no UI. It is a hack to mount additional UI-less components
// that will keep track and update the status of each withdrawal. UI-less
// components are a very dirty hack. This should have been done in a library.
export function BitcoinWithdrawalsStatusUpdater() {
  const withdrawals = useBtcWithdrawals()

  // All withdrawals that are not in a final state shall be monitored.
  const withdrawalsToWatch = withdrawals.filter(
    withdrawal =>
      ![
        BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED,
        BtcWithdrawStatus.WITHDRAWAL_FAILED,
      ].includes(withdrawal.status),
  )
  return (
    <>
      {withdrawalsToWatch.map(withdrawal => (
        <WatchInitiatedBitcoinWithdrawal
          key={withdrawal.transactionHash}
          withdrawal={withdrawal}
        />
      ))}
    </>
  )
}
