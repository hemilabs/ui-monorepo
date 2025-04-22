import { type ToBtcWithdrawOperation, BtcWithdrawStatus } from 'types/tunnel'
import { getHemiClient } from 'utils/chainClients'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import {
  getBitcoinWithdrawalUuid,
  getHemiStatusOfBtcWithdrawal,
} from 'utils/hemi'
import { isPendingOperation } from 'utils/tunnel'

const addMissingInfo = async function (withdrawal: ToBtcWithdrawOperation) {
  const updates: Partial<ToBtcWithdrawOperation> = {}
  const receipt = await getEvmTransactionReceipt(
    withdrawal.transactionHash,
    withdrawal.l2ChainId,
  )
  if (!receipt) {
    throw new Error(`Receipt not found for tx ${withdrawal.transactionHash}`)
  }
  if (withdrawal.uuid === undefined) {
    // for failed status, uuid may be found depending on which step of the flow failed
    const uuid = getBitcoinWithdrawalUuid(receipt)
    if (uuid) {
      updates.uuid = uuid.toString()
    }
  }
  if (!withdrawal.timestamp) {
    const block = await getEvmBlock(receipt.blockNumber, withdrawal.l2ChainId)
    updates.timestamp = Number(block.timestamp)
  }
  if (!withdrawal.blockNumber) {
    updates.blockNumber = Number(receipt.blockNumber)
  }
  return updates
}

export const watchBitcoinWithdrawal = async function (
  withdrawal: ToBtcWithdrawOperation,
) {
  const updates: Partial<ToBtcWithdrawOperation> = {}

  const hemiClient = getHemiClient(withdrawal.l2ChainId)

  // if the withdrawal is on a final state, it won't change, so there's no need to re-check it
  const newStatus = isPendingOperation(withdrawal)
    ? await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })
    : withdrawal.status

  if (withdrawal.status !== newStatus) {
    updates.status = newStatus
  }

  // check for values that may be missing
  if (
    newStatus !== BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING &&
    (withdrawal.uuid === undefined || !withdrawal.timestamp)
  ) {
    Object.assign(updates, {
      ...(await addMissingInfo(withdrawal)),
    })
  }

  return updates
}
