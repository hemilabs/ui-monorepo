import { useQuery } from '@tanstack/react-query'
import { useBtcWithdrawals } from 'hooks/useBtcWithdrawals'
import { useHemiClient } from 'hooks/useHemiClient'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import PQueue from 'p-queue'
import { BtcWithdrawStatus, ToBtcWithdrawOperation } from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import {
  getBitcoinWithdrawalUuid,
  getHemiStatusOfBtcWithdrawal,
} from 'utils/hemi'

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
    const updates: Partial<ToBtcWithdrawOperation> = {}
    const newStatus = await getHemiStatusOfBtcWithdrawal({
      hemiClient,
      withdrawal,
    })
    if (withdrawal.status !== newStatus) {
      updates.status = newStatus
    }

    if (
      newStatus >= BtcWithdrawStatus.TX_CONFIRMED &&
      (withdrawal.uuid === undefined || withdrawal.timestamp)
    ) {
      const receipt = await getEvmTransactionReceipt(
        withdrawal.transactionHash,
        withdrawal.l2ChainId,
      )
      if (!receipt) {
        throw new Error(
          `Receipt not found  for tx ${withdrawal.transactionHash}`,
        )
      }

      if (withdrawal.uuid === undefined) {
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
    }
    if (Object.keys(updates).length > 0) {
      updateWithdrawal(withdrawal, updates)
    }
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
