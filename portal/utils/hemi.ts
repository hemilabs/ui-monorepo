import { WalletConnector } from 'btc-wallet/connectors/types'
import { Satoshis } from 'btc-wallet/unisat'
import {
  acknowledgedDeposits,
  calculateDepositFee,
  calculateWithdrawalFee,
  getTransactionByTxId,
  getTxConfirmations,
  isAddressValid,
  isBitcoinWithdrawalChallenged,
  isBitcoinWithdrawalFulfilled,
} from 'hemi-viem/actions'
import { bitcoinTunnelManagerAbi } from 'hemi-viem/contracts'
import { HemiWalletClient } from 'hooks/useHemiClient'
import {
  type BtcDepositOperation,
  BtcDepositStatus,
  BtcWithdrawStatus,
  type ToBtcWithdrawOperation,
} from 'types/tunnel'
import {
  type Address,
  parseEventLogs,
  type PublicClient,
  type TransactionReceipt,
} from 'viem'

import { calculateDepositOutputIndex } from './bitcoin'
import { createBtcApi, mapBitcoinNetwork } from './btcApi'
import {
  getBitcoinDepositVaultIndex,
  getBitcoinWithdrawalVaultIndex,
} from './hemiClientExtraActions'
import {
  getBitcoinCustodyAddress,
  getBitcoinKitAddress,
  getBitcoinVaultGracePeriod,
  getBitcoinVaultStateAddress,
  getVaultAddressByIndex,
} from './hemiMemoized'

// Max Sanchez note: looks like if we pass in all lower-case hex, Unisat publishes the bytes instead of the string.
// Tunnel for now is only validating the string representation, but update this in the future using
// the all-lower-case-hex way to get the raw bytes published, which is more efficient.
export const hemiAddressToBitcoinOpReturn = (hemiAddress: Address) =>
  hemiAddress.toUpperCase().slice(2)

export const getDepositVaultAddress = (hemiClient: PublicClient) =>
  getBitcoinDepositVaultIndex(hemiClient).then(vaultIndex =>
    getVaultAddressByIndex(hemiClient, vaultIndex),
  )

const BitcoinConfirmationsOnHemi = 6

export const getHemiStatusOfBtcDeposit = ({
  deposit,
  hemiClient,
  vaultAddress,
}: {
  // Omit status so we can use this method for both getting the status the first time
  // or updating it when it already exists
  deposit: Omit<BtcDepositOperation, 'status'>
  hemiClient: PublicClient
  vaultAddress: Address
}) =>
  Promise.all([
    getBitcoinKitAddress(hemiClient).then(bitcoinKitAddress =>
      // check if Hemi is aware of the btc transaction
      getTransactionByTxId(hemiClient, {
        bitcoinKitAddress,
        txId: deposit.transactionHash,
      })
        // api throws if not found
        .catch(() => undefined)
        .then(txFound => !!txFound),
    ),
    // check if the deposit's been confirmed
    getBitcoinVaultStateAddress(hemiClient, vaultAddress).then(
      vaultStateAddress =>
        acknowledgedDeposits(hemiClient, {
          txId: deposit.transactionHash,
          vaultStateAddress,
        }),
    ),
    // check the number of confirmations of the deposit
    getBitcoinKitAddress(hemiClient).then(bitcoinKitAddress =>
      getTxConfirmations(hemiClient, {
        bitcoinKitAddress,
        txId: deposit.transactionHash,
      })
        // api throws if the tx Id is not found, which is the same as 0 confirmations from our POV.
        .catch(() => 0),
    ),
  ]).then(function ([hemiAwareOfBtcTx, confirmed, confirmations]) {
    if (!hemiAwareOfBtcTx) {
      return BtcDepositStatus.BTC_TX_CONFIRMED
    }
    if (confirmed) {
      return BtcDepositStatus.BTC_DEPOSITED
    }
    // Hemi requires 6 confirmations before a deposit is manually processed. If that doesn't happen
    // it should allow the user to manually confirm the deposit.
    if (confirmations > BitcoinConfirmationsOnHemi) {
      return BtcDepositStatus.READY_TO_MANUAL_CONFIRM
    }
    return BtcDepositStatus.BTC_TX_CONFIRMED
  })

/**
 * Returns true if a withdrawal was marked as successfully challenged
 */
const getIsBitcoinWithdrawalChallenged = ({
  hemiClient,
  uuid,
  vaultAddress,
}: {
  hemiClient: PublicClient
  uuid: bigint
  vaultAddress: Address
}) =>
  getBitcoinVaultStateAddress(hemiClient, vaultAddress).then(
    vaultStateAddress =>
      isBitcoinWithdrawalChallenged(hemiClient, {
        uuid,
        vaultStateAddress,
      }),
  )

/**
 * Returns true if a fulfillment transaction exists on Bitcoin and it has been communicated
 * to the vault.
 */
const getIsBitcoinWithdrawalFulfilled = ({
  hemiClient,
  uuid,
  vaultAddress,
}: {
  hemiClient: PublicClient
  uuid: bigint
  vaultAddress: Address
}) =>
  getBitcoinVaultStateAddress(hemiClient, vaultAddress).then(
    vaultStateAddress =>
      isBitcoinWithdrawalFulfilled(hemiClient, {
        uuid,
        vaultStateAddress,
      }),
  )

export const getBitcoinWithdrawalGracePeriod = ({
  hemiClient,
  vaultIndex,
}: {
  hemiClient: PublicClient
  vaultIndex: number
}) =>
  getVaultAddressByIndex(hemiClient, vaultIndex).then(vaultAddress =>
    getBitcoinVaultGracePeriod(hemiClient, vaultAddress),
  )

const getInitiatedWithdrawalStatus = async function ({
  hemiClient,
  withdrawal,
}: {
  hemiClient: PublicClient
  withdrawal: ToBtcWithdrawOperation
}) {
  const receipt = await hemiClient
    .getTransactionReceipt({ hash: withdrawal.transactionHash })
    .catch(function (err) {
      // Do nothing if the TX was not found, as that throws
      if (err.name === 'TransactionReceiptNotFoundError') {
        return null
      }
      throw err
    })

  if (!receipt) {
    // keep same status as before
    return BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING
  }
  return receipt.status === 'success'
    ? BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED
    : BtcWithdrawStatus.WITHDRAWAL_FAILED
}

const getUuid = function (withdrawal: ToBtcWithdrawOperation): bigint {
  if (!withdrawal.uuid) {
    throw new Error(`Missing uuid for withdrawal ${withdrawal.transactionHash}`)
  }

  return BigInt(withdrawal.uuid)
}

const getVault = function (withdrawal: ToBtcWithdrawOperation): Address {
  if (!withdrawal.vault) {
    throw new Error(
      `Missing vault for withdrawal ${withdrawal.transactionHash}`,
    )
  }

  return withdrawal.vault
}

export const getHemiStatusOfBtcWithdrawal = async function ({
  hemiClient,
  withdrawal,
}: {
  hemiClient: PublicClient
  withdrawal: ToBtcWithdrawOperation
}) {
  if (withdrawal.status === BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING) {
    return getInitiatedWithdrawalStatus({ hemiClient, withdrawal })
  }

  const uuid = getUuid(withdrawal)

  // If the initiation succeeded, the BTC transaction must be monitored. If
  // present, move it to WITHDRAWAL_SUCCEEDED but if not and the withdrawal is
  // more than ${grace period}, move it to CHALLENGE_READY.
  if (withdrawal.status === BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED) {
    const vaultAddress = getVault(withdrawal)

    const [isFulfilled, isChallenged] = await Promise.all([
      getIsBitcoinWithdrawalFulfilled({
        hemiClient,
        uuid,
        vaultAddress,
      }),
      getIsBitcoinWithdrawalChallenged({
        hemiClient,
        uuid,
        vaultAddress,
      }),
    ])
    if (isFulfilled) {
      return BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED
    }
    if (isChallenged) {
      return BtcWithdrawStatus.WITHDRAWAL_CHALLENGED
    }
    if (withdrawal.timestamp) {
      const gracePeriod = await getBitcoinVaultGracePeriod(
        hemiClient,
        vaultAddress,
      )
      const age = Math.floor(new Date().getTime() / 1000) - withdrawal.timestamp
      if (age > gracePeriod) {
        return BtcWithdrawStatus.READY_TO_CHALLENGE
      }
    }
  }
  if (
    withdrawal.status === BtcWithdrawStatus.READY_TO_CHALLENGE &&
    withdrawal.challengeTxHash
  ) {
    const hash = withdrawal.challengeTxHash

    const handleReadyToChallenge = async function () {
      const receipt = await hemiClient
        .getTransactionReceipt({ hash })
        .catch(function (err) {
          // Do nothing if the TX was not found, as that throws
          if (err.name === 'TransactionReceiptNotFoundError') {
            return null
          }
          throw err
        })
      if (!receipt) {
        return BtcWithdrawStatus.CHALLENGE_IN_PROGRESS
      }
      return receipt.status === 'success'
        ? BtcWithdrawStatus.WITHDRAWAL_CHALLENGED
        : BtcWithdrawStatus.CHALLENGE_FAILED
    }

    return handleReadyToChallenge()
  }
  // if we reach this point, return the same status as before
  return withdrawal.status
}

export const initiateBtcDeposit = function ({
  hemiAddress,
  hemiClient,
  satoshis,
  walletConnector,
}: {
  hemiAddress: Address
  hemiClient: PublicClient
  satoshis: Satoshis
  walletConnector: WalletConnector
}) {
  const memo = hemiAddressToBitcoinOpReturn(hemiAddress)

  if (satoshis <= 0) {
    return Promise.reject(
      new Error('Bitcoin to send must be greater than zero'),
    )
  }

  return (
    getBitcoinDepositVaultIndex(hemiClient)
      // get vault address which will custody the btc
      .then(vaultIndex => getVaultAddressByIndex(hemiClient, vaultIndex))
      // get the bitcoin address which the vault uses
      .then(vaultAddress => getBitcoinCustodyAddress(hemiClient, vaultAddress))
      .then(bitcoinCustodyAddress =>
        walletConnector
          .sendBitcoin(bitcoinCustodyAddress, satoshis, {
            memo,
          })
          .then(txHash => ({
            bitcoinCustodyAddress,
            txHash,
          })),
      )
  )
}

export const confirmBtcDeposit = ({
  deposit,
  from,
  hemiClient,
  hemiWalletClient,
}: {
  deposit: BtcDepositOperation
  from: Address
  hemiClient: PublicClient
  hemiWalletClient: HemiWalletClient
}) =>
  Promise.all([
    getBitcoinDepositVaultIndex(hemiClient),
    getDepositVaultAddress(hemiClient).then(vaultAddress =>
      getHemiStatusOfBtcDeposit({ deposit, hemiClient, vaultAddress }),
    ),
    createBtcApi(mapBitcoinNetwork(deposit.l1ChainId))
      .getTransactionReceipt(deposit.transactionHash)
      .then(receipt => calculateDepositOutputIndex(receipt!, deposit.to)),
  ]).then(function ([vaultIndex, currentStatus, outputIndex]) {
    if (currentStatus === BtcDepositStatus.BTC_DEPOSITED) {
      throw new Error('Bitcoin Deposit already confirmed')
    }
    if (currentStatus !== BtcDepositStatus.READY_TO_MANUAL_CONFIRM) {
      throw new Error('Bitcoin Deposit is not ready for confirmation!')
    }

    return hemiWalletClient!.confirmDeposit({
      // For current vault implementations, the field is not used... but required by
      // the abi
      extraInfo: '0x',
      from,
      outputIndex: BigInt(outputIndex),
      txId: deposit.transactionHash,
      vaultIndex,
    })
  })

// The logs must be decoded as viem does not seem to do so automatically.
const getWithdrawalInitiatedEvent = (receipt: TransactionReceipt) =>
  parseEventLogs({ abi: bitcoinTunnelManagerAbi, logs: receipt.logs }).find(
    event => event.eventName === 'WithdrawalInitiated',
  )

// The withdrawal uuid is a 64-bit number needed to challenge the
// operation if the operator does not process it timely, within 12 hours.
// It is an argument of the WithdrawalInitiated event and can be easily
// read from the receipt logs.
export const getBitcoinWithdrawalUuid = (receipt: TransactionReceipt) =>
  getWithdrawalInitiatedEvent(receipt)?.args.uuid satisfies bigint | undefined

export const getBitcoinWithdrawalVault = (receipt: TransactionReceipt) =>
  getWithdrawalInitiatedEvent(receipt)?.args.vault satisfies Address | undefined

const calculateBtcDepositFee = (
  hemiClient: PublicClient,
  { amount, vaultStateAddress }: { amount: bigint; vaultStateAddress: Address },
) =>
  calculateDepositFee(hemiClient, {
    depositAmount: amount,
    vaultStateAddress,
  })

export const getBitcoinDepositFee = ({
  amount,
  hemiClient,
}: {
  amount: bigint
  hemiClient: PublicClient
}) =>
  getBitcoinDepositVaultIndex(hemiClient)
    .then(vaultIndex => getVaultAddressByIndex(hemiClient, vaultIndex))
    .then(vaultAddress => getBitcoinVaultStateAddress(hemiClient, vaultAddress))
    .then(vaultStateAddress =>
      calculateBtcDepositFee(hemiClient, { amount, vaultStateAddress }),
    )

const calculateBtcWithdrawalFee = (
  hemiClient: PublicClient,
  { amount, vaultStateAddress }: { amount: bigint; vaultStateAddress: Address },
) =>
  calculateWithdrawalFee(hemiClient, {
    vaultStateAddress,
    withdrawalAmount: amount,
  })

export const getBitcoinWithdrawalFee = ({
  amount,
  hemiClient,
}: {
  amount: bigint
  hemiClient: PublicClient
}) =>
  getBitcoinWithdrawalVaultIndex(hemiClient)
    .then(vaultIndex => getVaultAddressByIndex(hemiClient, vaultIndex))
    .then(vaultAddress => getBitcoinVaultStateAddress(hemiClient, vaultAddress))
    .then(vaultStateAddress =>
      calculateBtcWithdrawalFee(hemiClient, { amount, vaultStateAddress }),
    )

export const isValidBtcAddress = (
  hemiClient: PublicClient,
  btcAddress: string,
) =>
  getBitcoinKitAddress(hemiClient)
    .then(bitcoinKitAddress =>
      isAddressValid(hemiClient, { bitcoinKitAddress, btcAddress }),
    )
    .catch(function (err) {
      if (err.cause?.name === 'ContractFunctionRevertedError') {
        return false
      }
      throw err
    })
