import debugConstructor from 'debug'
import { publicClientToHemiClient } from 'hooks/useHemiClient'
import pMemoize from 'promise-mem'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { getBitcoinTimestamp } from 'utils/bitcoin'
import { createBtcApi, mapBitcoinNetwork } from 'utils/btcApi'
import { findChainById } from 'utils/chain'
import { getHemiStatusOfBtcDeposit, getVaultAddressByDeposit } from 'utils/hemi'
import { hasKeys } from 'utils/utilities'
import { type Chain, createPublicClient, http } from 'viem'

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
    ? BtcDepositStatus.TX_CONFIRMED
    : BtcDepositStatus.TX_PENDING

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
    updates.timestamp = getBitcoinTimestamp(receipt.status.blockTime)
  }

  if (!hasKeys(updates)) {
    debug('No changes for deposit %s on bitcoin chain', deposit.transactionHash)
  }

  return updates
}

const getHemiClient = pMemoize(async function (chainId: Chain['id']) {
  // L2 are always EVM
  const l2Chain = findChainById(chainId) as Chain
  const publicClient = createPublicClient({
    chain: l2Chain,
    transport: http(),
  })
  return publicClientToHemiClient(publicClient)
})

export const watchDepositOnHemi = async function (
  deposit: BtcDepositOperation,
) {
  const hemiClient = await getHemiClient(deposit.l2ChainId)

  const newStatus = await getVaultAddressByDeposit(hemiClient, deposit).then(
    vaultAddress =>
      getHemiStatusOfBtcDeposit({
        deposit,
        hemiClient,
        vaultAddress,
      }),
  )
  if (deposit.status !== newStatus) {
    debug(
      'Deposit %s status changed from %s to %s',
      deposit.transactionHash,
      deposit.status,
      newStatus,
    )
    return { status: newStatus }
  }

  debug('No changes for deposit %s on hemi chain', deposit.transactionHash)

  return {}
}
