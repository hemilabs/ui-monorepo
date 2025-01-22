import { EvmDepositStatus, type EvmDepositOperation } from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'

export const watchEvmDeposit = async function (deposit: EvmDepositOperation) {
  const updates: Partial<EvmDepositOperation> = {}

  // check if it has completed on the background
  const receipt = await getEvmTransactionReceipt(
    deposit.transactionHash,
    deposit.l1ChainId,
  )
  // if receipt was not found, it means the transaction is still pending - return here
  if (!receipt) {
    return updates
  }
  const newStatus =
    receipt.status === 'success'
      ? EvmDepositStatus.DEPOSIT_TX_CONFIRMED
      : EvmDepositStatus.DEPOSIT_TX_FAILED
  // if the status has changed, save the update
  if (deposit.status !== newStatus) {
    updates.status = newStatus
  }

  if (!updates.blockNumber) {
    updates.blockNumber = Number(receipt.blockNumber)
  }
  if (!updates.timestamp) {
    updates.timestamp = await getEvmBlock(
      receipt.blockNumber,
      deposit.l1ChainId,
    ).then(block => Number(block.timestamp))
  }

  return updates
}
