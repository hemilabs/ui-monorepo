import debugConstructor from 'debug'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { getBitcoinTimestamp } from 'utils/bitcoin'
import { createBtcApi, mapBitcoinNetwork } from 'utils/btcApi'
import { getHemiClient } from 'utils/chainClients'
import { getHemiStatusOfBtcDeposit, getVaultAddressByDeposit } from 'utils/hemi'
import { getBtcDepositInfo } from 'utils/subgraph'
import { isPendingOperation } from 'utils/tunnel'
import { hasKeys } from 'utils/utilities'

const debug = debugConstructor('watch-btc-deposits-worker')

export const watchDepositOnBitcoin = async function (
  deposit: BtcDepositOperation,
) {
  debug('Watching deposit %s', deposit.transactionHash)
  const receipt = await createBtcApi(
    mapBitcoinNetwork(deposit.l1ChainId),
  ).getTransactionReceipt(deposit.transactionHash)
  if (!receipt) {
    debug('Receipt not found for deposit %s', deposit.transactionHash)
    return {}
  }

  const updates: Partial<BtcDepositOperation> = {}

  const newStatus = receipt.status.confirmed
    ? BtcDepositStatus.BTC_TX_CONFIRMED
    : BtcDepositStatus.BTC_TX_PENDING

  if (deposit.status !== newStatus) {
    debug(
      'Deposit %s status changed from %s to %s',
      deposit.transactionHash,
      deposit.status,
      newStatus,
    )
    updates.status = newStatus
  }
  if (deposit.timestamp === undefined && receipt.status.confirmed) {
    debug(
      'Timestamp and block number added to deposit %s',
      deposit.transactionHash,
    )
    updates.blockNumber = receipt.status.blockHeight
    // if receipt.status.confirmed is true, blockTime is defined
    updates.timestamp = getBitcoinTimestamp(receipt.status.blockTime!)
  }

  if (!hasKeys(updates)) {
    debug('No changes for deposit %s on bitcoin chain', deposit.transactionHash)
  }

  return updates
}

export const watchDepositOnHemi = async function (
  deposit: BtcDepositOperation,
) {
  const updates: Partial<BtcDepositOperation> = {}

  const hemiClient = getHemiClient(deposit.l2ChainId)

  const newStatus = isPendingOperation(deposit)
    ? await getVaultAddressByDeposit(hemiClient, deposit).then(vaultAddress =>
        getHemiStatusOfBtcDeposit({
          deposit,
          hemiClient,
          vaultAddress,
        }),
      )
    : deposit.status

  if (deposit.status !== newStatus) {
    debug(
      'Deposit %s status changed from %s to %s',
      deposit.transactionHash,
      deposit.status,
      newStatus,
    )
    updates.status = newStatus
  }

  if (
    !isPendingOperation({ ...deposit, status: newStatus }) &&
    !deposit.confirmationTransactionHash
  ) {
    // Try to get l2TransactionHash from the subgraph API if not already present
    const depositInfo = await getBtcDepositInfo({
      chainId: deposit.l2ChainId,
      depositTxId: deposit.transactionHash,
    })

    if (depositInfo?.transactionHash) {
      debug(
        'Found transaction hash %s for deposit %s',
        depositInfo.transactionHash,
        deposit.transactionHash,
      )
      updates.confirmationTransactionHash = depositInfo.transactionHash
    }
  }

  if (!hasKeys(updates)) {
    debug('No changes for deposit %s on hemi chain', deposit.transactionHash)
  }

  return updates
}
