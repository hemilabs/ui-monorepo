import type { Address, TransactionReceipt } from 'viem'
import { isAddress, parseEventLogs, zeroAddress } from 'viem'

import { veHemiAbi } from './abi'
import {
  MaxLockDurationSeconds,
  MinLockDurationSeconds,
  SupportedChains,
} from './constants'

const validateAccount = function (account: Address) {
  if (!isAddress(account)) {
    return 'account is not a valid address'
  }

  if (account === zeroAddress) {
    return 'account cannot be zero address'
  }

  return undefined
}

const validateTokenId = function (tokenId: bigint) {
  if (tokenId <= BigInt(0)) {
    return 'invalid token ID'
  }

  return undefined
}

const validateChain = function (chainId: number) {
  const isSupportedChain = SupportedChains.includes(chainId)
  if (!isSupportedChain) {
    return 'chain is not supported'
  }

  return undefined
}

const validateAmount = function (amount: bigint) {
  if (amount === BigInt(0)) {
    return 'amount cannot be zero'
  }

  if (amount < BigInt(0)) {
    return 'amount cannot be negative'
  }

  return undefined
}

const validateApprovalAmount = function (
  amount: bigint,
  approvalAmount: bigint,
) {
  if (approvalAmount < amount) {
    return 'approval amount cannot be less than amount'
  }

  return undefined
}

export const validateCreateLockInputs = function ({
  account,
  amount,
  approvalAmount = amount,
  chainId,
  lockDurationInSeconds,
}: {
  account: Address
  amount: bigint
  approvalAmount?: bigint
  chainId: number
  lockDurationInSeconds: number
}) {
  const accountError = validateAccount(account)
  if (accountError) {
    return accountError
  }

  const chainError = validateChain(chainId)
  if (chainError) {
    return chainError
  }

  const amountError = validateAmount(amount)
  if (amountError) {
    return amountError
  }

  const approvalError = validateApprovalAmount(amount, approvalAmount)
  if (approvalError) {
    return approvalError
  }

  if (lockDurationInSeconds < MinLockDurationSeconds) {
    return 'lock duration is too short'
  }

  if (lockDurationInSeconds > MaxLockDurationSeconds) {
    return 'lock duration is too long (maximum 4 years)'
  }

  return undefined
}

export const validateIncreaseAmountInputs = function ({
  account,
  additionalAmount,
  approvalAdditionalAmount = additionalAmount,
  chainId,
  tokenId,
}: {
  account: Address
  additionalAmount: bigint
  approvalAdditionalAmount?: bigint
  chainId: number
  tokenId: bigint
}) {
  const accountError = validateAccount(account)
  if (accountError) {
    return accountError
  }

  const chainError = validateChain(chainId)
  if (chainError) {
    return chainError
  }

  const tokenError = validateTokenId(tokenId)
  if (tokenError) {
    return tokenError
  }

  const amountError = validateAmount(additionalAmount)
  if (amountError) {
    return amountError
  }

  const approvalError = validateApprovalAmount(
    additionalAmount,
    approvalAdditionalAmount,
  )
  if (approvalError) {
    return approvalError
  }

  return undefined
}

export const validateIncreaseUnlockTimeInputs = function ({
  account,
  chainId,
  lockDurationInSeconds,
  tokenId,
}: {
  account: Address
  chainId: number
  lockDurationInSeconds: number
  tokenId: bigint
}) {
  const accountError = validateAccount(account)
  if (accountError) {
    return accountError
  }

  const chainError = validateChain(chainId)
  if (chainError) {
    return chainError
  }

  const tokenError = validateTokenId(tokenId)
  if (tokenError) {
    return tokenError
  }

  if (lockDurationInSeconds <= 0) {
    return 'lock duration must be positive'
  }

  if (lockDurationInSeconds > MaxLockDurationSeconds) {
    return 'lock duration is too long (maximum 4 years)'
  }

  return undefined
}

export const validateWithdrawInputs = function ({
  account,
  chainId,
  tokenId,
}: {
  account: Address
  chainId: number
  tokenId: bigint
}) {
  const accountError = validateAccount(account)
  if (accountError) {
    return accountError
  }

  const chainError = validateChain(chainId)
  if (chainError) {
    return chainError
  }

  const tokenError = validateTokenId(tokenId)
  if (tokenError) {
    return tokenError
  }

  return undefined
}

type VeHemiLockEvent = {
  lockDuration: bigint
  tokenId: bigint
  ts: bigint
}

export const getLockEvent = (receipt: TransactionReceipt) =>
  parseEventLogs({ abi: veHemiAbi, logs: receipt.logs }).find(
    event => event.eventName === 'Lock',
  )?.args as VeHemiLockEvent | undefined
