import { ToEvmWithdrawOperation } from 'types/tunnel'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { getEvmWithdrawalStatus } from 'utils/tunnel'

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

const getBlockTimestamp = (withdrawal: ToEvmWithdrawOperation) =>
  async function (
    blockNumber: number | undefined,
  ): Promise<[number?, number?]> {
    // Can't return a block if we don't know the number
    if (blockNumber === undefined) {
      return []
    }
    // Block and timestamp already known - return them
    if (withdrawal.timestamp) {
      return [blockNumber, withdrawal.timestamp]
    }
    const { timestamp } = await getEvmBlock(blockNumber, withdrawal.l2ChainId)
    return [blockNumber, Number(timestamp)]
  }

export const watchEvmWithdrawal = async function (
  withdrawal: ToEvmWithdrawOperation,
) {
  const updates: Partial<ToEvmWithdrawOperation> = {}

  const l1publicClient = getEvmL1PublicClient(withdrawal.l1ChainId)

  const receipt = await getEvmTransactionReceipt(
    withdrawal.transactionHash,
    withdrawal.l2ChainId,
  )

  if (!receipt) {
    return updates
  }

  const [status, [blockNumber, timestamp]] = await Promise.all([
    getEvmWithdrawalStatus({
      l1publicClient,
      l2ChainId: withdrawal.l2ChainId,
      receipt,
    }),
    getTransactionBlockNumber(withdrawal).then(getBlockTimestamp(withdrawal)),
  ])

  if (withdrawal.status !== status) {
    updates.status = status
  }
  if (withdrawal.blockNumber !== blockNumber) {
    updates.blockNumber = blockNumber
  }
  if (withdrawal.timestamp !== timestamp) {
    updates.timestamp = timestamp
  }

  return updates
}
