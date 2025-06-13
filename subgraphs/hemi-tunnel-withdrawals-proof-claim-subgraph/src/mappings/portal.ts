import {
  WithdrawalFinalized as WithdrawalFinalizedEvent,
  WithdrawalProven as WithdrawalProvenEvent,
} from '../../generated/portal/portal'
import { log } from '@graphprotocol/graph-ts'
import { Withdrawal } from '../entities/withdrawal'

export function handleWithdrawalProven(event: WithdrawalProvenEvent): void {
  let withdrawal = Withdrawal.load(event.params.withdrawalHash)
  if (withdrawal == null) {
    withdrawal = new Withdrawal(event.params.withdrawalHash)
  }
  withdrawal.proveTxHash = event.transaction.hash
  withdrawal.save()
}

export function handleWithdrawalFinalized(
  event: WithdrawalFinalizedEvent,
): void {
  if (!event.params.success) {
    return
  }
  let withdrawal = Withdrawal.load(event.params.withdrawalHash)
  if (withdrawal == null) {
    // This should never happen, as before being finalized , the withdrawal should've been proved
    // Regardless, let's save it to avoid missing data
    log.warning(
      'Withdrawal entity not found for withdrawalHash {}. Creating new.',
      [event.params.withdrawalHash.toHexString()],
    )
    withdrawal = new Withdrawal(event.params.withdrawalHash)
  }
  withdrawal.claimTxHash = event.transaction.hash
  withdrawal.save()
}
