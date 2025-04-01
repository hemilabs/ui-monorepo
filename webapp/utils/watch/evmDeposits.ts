import { MessageStatus } from '@eth-optimism/sdk'
import pMemoize from 'promise-mem'
import { EvmDepositStatus, type EvmDepositOperation } from 'types/tunnel'
import { findChainById } from 'utils/chain'
import { createQueuedCrossChainMessenger } from 'utils/crossChainMessenger'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { createProvider } from 'utils/providers'
import { Chain } from 'viem'

const getCrossChainMessenger = pMemoize(
  function (l1Chain: Chain, l2Chain: Chain) {
    const l1Provider = createProvider(l1Chain)

    const l2Provider = createProvider(l2Chain)

    return createQueuedCrossChainMessenger({
      l1ChainId: l1Chain.id,
      l1Signer: l1Provider,
      l2Chain,
      l2Signer: l2Provider,
    })
  },
  { resolver: (l1Chain, l2Chain) => `${l1Chain.id}-${l2Chain.id}` },
)

export const watchEvmDeposit = async function (deposit: EvmDepositOperation) {
  const updates: Partial<EvmDepositOperation> = {}

  const l1Chain = findChainById(deposit.l1ChainId) as Chain
  const l2Chain = findChainById(deposit.l2ChainId) as Chain

  const crossChainMessenger = await getCrossChainMessenger(l1Chain, l2Chain)

  // check if it has completed on the background
  const receipt = await getEvmTransactionReceipt(
    deposit.transactionHash,
    deposit.l1ChainId,
  )
  // if receipt was not found, it means the transaction is still pending - return here
  if (!receipt) {
    return updates
  }

  const status = await crossChainMessenger.getMessageStatus(
    deposit.transactionHash,
    0,
    deposit.direction,
  )

  let newStatus: EvmDepositStatus
  if (status === MessageStatus.RELAYED) {
    newStatus = EvmDepositStatus.DEPOSIT_RELAYED
  } else if (receipt.status === 'success') {
    newStatus = EvmDepositStatus.DEPOSIT_TX_CONFIRMED
  } else {
    newStatus = EvmDepositStatus.DEPOSIT_TX_FAILED
  }

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
