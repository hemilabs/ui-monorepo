import { type ToBtcWithdrawOperation, BtcWithdrawStatus } from 'types/tunnel'
import { getPublicClient } from 'utils/chainClients'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import {
  getBitcoinWithdrawalUuid,
  getBitcoinWithdrawalVault,
  getHemiStatusOfBtcWithdrawal,
} from 'utils/hemi'
import {
  isBtcWithdrawalMissingInformation,
  isPendingOperation,
} from 'utils/tunnel'

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
  if (!withdrawal.vault) {
    const vault = getBitcoinWithdrawalVault(receipt)
    if (vault) {
      updates.vault = vault
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
  const hemiClient = getPublicClient(withdrawal.l2ChainId)

  // a pending withdrawal resolves its status from the receipt of the initiating
  // transaction, so it needs no vault - and the receipt may not even exist yet
  if (withdrawal.status === BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING) {
    const status = await getHemiStatusOfBtcWithdrawal({
      hemiClient,
      withdrawal,
    })

    if (status === withdrawal.status) {
      return {}
    }
    // it is no longer pending, so the receipt exists and the missing fields
    // can be restored on this same run
    const confirmed = { ...withdrawal, status }
    return isBtcWithdrawalMissingInformation(confirmed)
      ? { ...(await addMissingInfo(confirmed)), status }
      : { status }
  }

  // any other status is checked against the vault it was initiated with,
  // so the vault must be restored first
  const updates: Partial<ToBtcWithdrawOperation> =
    isBtcWithdrawalMissingInformation(withdrawal)
      ? await addMissingInfo(withdrawal)
      : {}

  const updatedWithdrawal = { ...withdrawal, ...updates }

  // if the withdrawal is on a final state, it won't change, so there's no need to re-check it
  if (!isPendingOperation(updatedWithdrawal)) {
    return updates
  }

  const status = await getHemiStatusOfBtcWithdrawal({
    hemiClient,
    withdrawal: updatedWithdrawal,
  })

  return status === withdrawal.status ? updates : { ...updates, status }
}
