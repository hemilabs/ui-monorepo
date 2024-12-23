import { type ToBtcWithdrawOperation, BtcWithdrawStatus } from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import {
  getBitcoinWithdrawalUuid,
  getHemiStatusOfBtcWithdrawal,
} from 'utils/hemi'

import { getHemiClient } from './common'

export const watchBitcoinWithdrawal = async function (
  withdrawal: ToBtcWithdrawOperation,
) {
  const updates: Partial<ToBtcWithdrawOperation> = {}

  const hemiClient = await getHemiClient(withdrawal.l2ChainId)

  const newStatus = await getHemiStatusOfBtcWithdrawal({
    hemiClient,
    withdrawal,
  })

  if (withdrawal.status !== newStatus) {
    updates.status = newStatus
  }

  // check for values that may be missing
  if (
    newStatus >= BtcWithdrawStatus.TX_CONFIRMED &&
    (withdrawal.uuid === undefined || !withdrawal.timestamp)
  ) {
    const receipt = await getEvmTransactionReceipt(
      withdrawal.transactionHash,
      withdrawal.l2ChainId,
    )
    if (!receipt) {
      throw new Error(`Receipt not found for tx ${withdrawal.transactionHash}`)
    }
    if (withdrawal.uuid === undefined) {
      updates.uuid = getBitcoinWithdrawalUuid(
        // @ts-expect-error wagmi seems to be wrongly typed
        receipt,
      ).toString()
    }
    if (!withdrawal.timestamp) {
      const block = await getEvmBlock(receipt.blockNumber, withdrawal.l2ChainId)
      updates.timestamp = Number(block.timestamp)
    }
    if (!withdrawal.blockNumber) {
      updates.blockNumber = Number(receipt.blockNumber)
    }
  }

  return updates
}
