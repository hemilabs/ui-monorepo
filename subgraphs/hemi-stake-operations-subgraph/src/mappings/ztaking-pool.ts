// Note: This file is written in AssemblyScript. It is required like this to run in the Graph nodes.
// See docs https://www.assemblyscript.org/ - don't let the .ts extension confuse you. It's fairly limited
// and many js/ts operations are not supported
import { BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from '../../generated/ZtakingPool/ZtakingPool'
import { Deposit, TokenStakeBalance, Withdraw } from '../../generated/schema'

const getTokenStakeBalance = function (tokenAddress: Bytes): TokenStakeBalance {
  let tokenStakeBalance = TokenStakeBalance.load(tokenAddress)
  if (tokenStakeBalance == null) {
    tokenStakeBalance = new TokenStakeBalance(tokenAddress)
    tokenStakeBalance.totalStaked = BigInt.fromI32(0)
  }
  return tokenStakeBalance
}

export function handleDeposit(event: DepositEvent): void {
  log.debug('Found stake operation {}', [event.transaction.hash.toHexString()])
  let entity = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.eventId = event.params.eventId
  entity.depositor = event.params.depositor
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  const tokenStake = getTokenStakeBalance(event.params.token)

  tokenStake.totalStaked = tokenStake.totalStaked.plus(event.params.amount)

  log.debug('Saving stake operation {}', [event.transaction.hash.toHexString()])
  entity.save()
  log.debug('Saving updated total staked for token {}', [
    event.params.token.toHexString(),
  ])
  tokenStake.save()
  log.info('Stake operation {} saved', [event.transaction.hash.toHexString()])
}

export function handleWithdraw(event: WithdrawEvent): void {
  log.debug('Found unstake operation {}', [
    event.transaction.hash.toHexString(),
  ])
  let entity = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.eventId = event.params.eventId
  entity.withdrawer = event.params.withdrawer
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  const tokenStake = getTokenStakeBalance(event.params.token)

  tokenStake.totalStaked = tokenStake.totalStaked.minus(event.params.amount)

  if (tokenStake.totalStaked.lt(BigInt.fromI32(0))) {
    // should never happen, but...
    log.error('Total staked for token {} is negative', [
      event.params.token.toHexString(),
    ])
  }

  log.debug('Saving unstake operation {}', [
    event.transaction.hash.toHexString(),
  ])
  entity.save()
  log.debug('Saving updated total staked for token {}', [
    event.params.token.toHexString(),
  ])
  tokenStake.save()
  log.info('Unstake operation {} saved', [event.transaction.hash.toHexString()])
}
