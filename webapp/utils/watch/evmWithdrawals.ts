import pMemoize from 'promise-mem'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { findChainById } from 'utils/chain'
import { createQueuedCrossChainMessenger } from 'utils/crossChainMessenger'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { createPublicProvider } from 'utils/providers'
import { Chain } from 'viem'

// Memoized cross chain messenger as this will be created by many withdrawals
const getCrossChainMessenger = pMemoize(
  function (l1Chain: Chain, l2Chain: Chain) {
    const l1Provider = createPublicProvider(
      l1Chain.rpcUrls.default.http[0],
      l1Chain,
    )

    const l2Provider = createPublicProvider(
      l2Chain.rpcUrls.default.http[0],
      l2Chain,
    )

    return createQueuedCrossChainMessenger({
      l1ChainId: l1Chain.id,
      l1Signer: l1Provider,
      l2Chain,
      l2Signer: l2Provider,
    })
  },
  { resolver: (l1Chain, l2Chain) => `${l1Chain.id}-${l2Chain.id}` },
)

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

  // as this worker watches withdrawals to EVM chains, l1Chain will be (EVM) Chain
  const l1Chain = findChainById(withdrawal.l1ChainId) as Chain
  // L2 are always EVM
  const l2Chain = findChainById(withdrawal.l2ChainId) as Chain

  const crossChainMessenger = await getCrossChainMessenger(l1Chain, l2Chain)
  const receipt = await getEvmTransactionReceipt(
    withdrawal.transactionHash,
    withdrawal.l2ChainId,
  )

  if (!receipt) {
    return updates
  }

  const [status, [blockNumber, timestamp]] = await Promise.all([
    crossChainMessenger.getMessageStatus(
      withdrawal.transactionHash,
      // default value, but we want to set direction
      0,
      withdrawal.direction,
    ),
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
