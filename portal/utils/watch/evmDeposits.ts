import { EvmDepositStatus, type EvmDepositOperation } from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { type TransactionReceipt } from 'viem'
import { getL2TransactionHashes } from 'viem/op-stack'

const calculateNewStatus = async function ({
  deposit,
  receipt,
}: {
  deposit: EvmDepositOperation
  receipt: TransactionReceipt | undefined | null
}) {
  // if receipt was not found, it means the transaction is still pending8
  if (!receipt) {
    return {}
  }

  if (receipt.status === 'reverted') {
    return { newStatus: EvmDepositStatus.DEPOSIT_TX_FAILED }
  }
  // deposit was successful, calculate the L2 hash
  const [l2TransactionHash] = getL2TransactionHashes(receipt)

  const l2Receipt = await getEvmTransactionReceipt(
    l2TransactionHash,
    deposit.l2ChainId,
  )
  // if not found, it means the tokens have not been minted in L2 yet
  // This means the status is L1 confirmed, which is the previous step
  if (!l2Receipt) {
    return { newStatus: EvmDepositStatus.DEPOSIT_TX_CONFIRMED }
  }

  if (l2Receipt.status === 'success') {
    return { l2TransactionHash, newStatus: EvmDepositStatus.DEPOSIT_RELAYED }
  }

  // L2 transaction failed. Unusual case.
  return { newStatus: EvmDepositStatus.DEPOSIT_TX_FAILED }
}

export const watchEvmDeposit = async function (deposit: EvmDepositOperation) {
  const updates: Partial<EvmDepositOperation> = {}

  // check if it has completed on the background
  const receipt = await getEvmTransactionReceipt(
    deposit.transactionHash,
    deposit.l1ChainId,
  )
  const { l2TransactionHash, newStatus } = await calculateNewStatus({
    deposit,
    receipt,
  })

  if (deposit.l2TransactionHash !== l2TransactionHash) {
    updates.l2TransactionHash = l2TransactionHash
  }

  if (newStatus !== undefined && deposit.status !== newStatus) {
    // if the status has changed, save the update
    updates.status = newStatus
  }

  if (!receipt) {
    return updates
  }

  if (!deposit.blockNumber) {
    updates.blockNumber = Number(receipt.blockNumber)
  }

  if (!deposit.timestamp) {
    updates.timestamp = await getEvmBlock(
      receipt.blockNumber,
      deposit.l1ChainId,
    ).then(block => Number(block.timestamp))
  }

  return updates
}
