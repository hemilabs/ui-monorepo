import { EventEmitter } from 'events'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { approve, allowance } from 'viem-erc20/actions'

import type { ApprovalEvents } from '../../types'

type DefaultEventMap = [never]
type EventMap<T> = Record<keyof T, unknown[]> | DefaultEventMap

export const handleApproval = async function <T extends ApprovalEvents>({
  account,
  amount,
  approvalAmount,
  emitter,
  hemiTokenAddress,
  veHemiAddress,
  walletClient,
}: {
  account: Address
  amount: bigint
  approvalAmount?: bigint
  emitter: EventEmitter<EventMap<T>>
  hemiTokenAddress: Address
  veHemiAddress: Address
  walletClient: WalletClient
}): Promise<boolean> {
  const tokenAllowance = await allowance(walletClient, {
    address: hemiTokenAddress,
    owner: account,
    spender: veHemiAddress,
  })

  if (amount > tokenAllowance) {
    emitter.emit('pre-approve')

    const approveHash = await approve(walletClient, {
      address: hemiTokenAddress,
      amount: approvalAmount ?? amount,
      spender: veHemiAddress,
    }).catch(function (error) {
      emitter.emit('user-signing-approve-error', error)
    })

    if (!approveHash) {
      return false
    }

    emitter.emit('user-signed-approve', approveHash)

    const approveReceipt = await waitForTransactionReceipt(walletClient, {
      hash: approveHash,
    }).catch(function (error) {
      emitter.emit('approve-failed', error)
    })

    if (!approveReceipt) {
      return false
    }

    const approveEventMap: Record<
      TransactionReceipt['status'],
      keyof ApprovalEvents
    > = {
      reverted: 'approve-transaction-reverted',
      success: 'approve-transaction-succeeded',
    }

    emitter.emit(approveEventMap[approveReceipt.status], approveReceipt)

    if (approveReceipt.status !== 'success') {
      return false
    }
  }

  return true
}
