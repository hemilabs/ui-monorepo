import { EventEmitter } from 'events'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { approveErc20Token, getErc20TokenAllowance } from 'viem-erc20/actions'

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
  // Using @ts-expect-error fails to compile so I need to use @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
  const allowance = await getErc20TokenAllowance(walletClient, {
    address: hemiTokenAddress,
    owner: account,
    spender: veHemiAddress,
  })

  if (amount > allowance) {
    emitter.emit('pre-approve')

    // Using @ts-expect-error fails to compile so I need to use @ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
    const approveHash = await approveErc20Token(walletClient, {
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

    // Using @ts-expect-error fails to compile so I need to use @ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
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
