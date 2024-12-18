import { WalletConnector } from 'btc-wallet/connectors/types'
import { Account as BtcAccount, Satoshis } from 'btc-wallet/unisat'
import { bitcoinTunnelManagerAbi } from 'hemi-viem/contracts'
import { HemiWalletClient, type HemiPublicClient } from 'hooks/useHemiClient'
import {
  type BtcDepositOperation,
  BtcDepositStatus,
  BtcWithdrawStatus,
  type ToBtcWithdrawOperation,
} from 'types/tunnel'
import { type Address, parseEventLogs, type TransactionReceipt } from 'viem'

import { calculateDepositOutputIndex } from './bitcoin'
import { getTransactionReceipt } from './btcApi'
import { getEvmTransactionReceipt } from './evmApi'
import {
  getBitcoinCustodyAddress,
  getBitcoinVaultGracePeriod,
  getBitcoinVaultStateAddress,
  getVaultAddressByIndex,
  getVaultIndexByBTCAddress,
} from './hemiMemoized'

// Max Sanchez note: looks like if we pass in all lower-case hex, Unisat publishes the bytes instead of the string.
// Tunnel for now is only validating the string representation, but update this in the future using
// the all-lower-case-hex way to get the raw bytes published, which is more efficient.
export const hemiAddressToBitcoinOpReturn = (hemiAddress: Address) =>
  hemiAddress.toUpperCase().slice(2)

export const getVaultAddressByDeposit = (
  hemiClient: HemiPublicClient,
  deposit: BtcDepositOperation,
) =>
  getVaultIndexByBTCAddress(hemiClient, deposit).then(vaultIndex =>
    getVaultAddressByIndex(hemiClient, vaultIndex),
  )

export const getHemiStatusOfBtcDeposit = ({
  deposit,
  hemiClient,
  vaultAddress,
}: {
  // Omit status so we can use this method for both getting the status the first time
  // or updating it when it already exists
  deposit: Omit<BtcDepositOperation, 'status'>
  hemiClient: HemiPublicClient
  vaultAddress: Address
}) =>
  Promise.all([
    // @ts-expect-error needs to be fixed https://github.com/hemilabs/hemi-viem/issues/30
    hemiClient.getBitcoinKitAddress().then(bitcoinKitAddress =>
      // check if Hemi is aware of the btc transaction
      hemiClient
        .getTransactionByTxId({
          bitcoinKitAddress,
          txId: deposit.transactionHash,
        })
        // api throws if not found
        .catch(() => undefined)
        .then(txFound => !!txFound),
    ),
    // check if the deposit's been confirmed
    hemiClient
      .getBitcoinVaultStateAddress({ vaultAddress })
      .then(vaultStateAddress =>
        hemiClient.acknowledgedDeposits({
          txId: deposit.transactionHash,
          vaultStateAddress,
        }),
      ),
  ]).then(([hemiAwareOfBtcTx, claimed]) =>
    hemiAwareOfBtcTx
      ? claimed
        ? BtcDepositStatus.BTC_DEPOSITED
        : BtcDepositStatus.BTC_READY_CLAIM
      : BtcDepositStatus.TX_CONFIRMED,
  )

// With the vault id, get its address from the tunnel manager, then get its
// state address, and with the uuid, check if the bitcoin transaction was
// sent. It will return 0 if the transaction was not posted yet.
const getBitcoinWithdrawalBitcoinTxId = ({
  hemiClient,
  vaultIndex,
  uuid,
}: {
  hemiClient: HemiPublicClient
  vaultIndex: number
  uuid: bigint
}) =>
  getVaultAddressByIndex(hemiClient, vaultIndex)
    .then(vaultAddress => getBitcoinVaultStateAddress(hemiClient, vaultAddress))
    .then(vaultStateAddress =>
      hemiClient.getBitcoinWithdrawalBitcoinTxId({
        uuid,
        vaultStateAddress,
      }),
    )

const getBitcoinWithdrawalGracePeriod = ({
  hemiClient,
  vaultIndex,
}: {
  hemiClient: HemiPublicClient
  vaultIndex: number
}) =>
  getVaultAddressByIndex(hemiClient, vaultIndex).then(vaultAddress =>
    getBitcoinVaultGracePeriod(hemiClient, vaultAddress),
  )

export const getHemiStatusOfBtcWithdrawal = async function ({
  hemiClient,
  withdrawal,
}: {
  hemiClient: HemiPublicClient
  withdrawal: ToBtcWithdrawOperation
}) {
  const bitcoinZeroAddress =
    '0x0000000000000000000000000000000000000000000000000000000000000000'

  if (withdrawal.status === BtcWithdrawStatus.TX_PENDING) {
    const receipt = await getEvmTransactionReceipt(
      withdrawal.transactionHash,
      withdrawal.l2ChainId,
    )
    if (!receipt) {
      // keep same status as before
      return BtcWithdrawStatus.TX_PENDING
    }
    return receipt.status === 'success'
      ? BtcWithdrawStatus.TX_CONFIRMED
      : BtcWithdrawStatus.WITHDRAWAL_FAILED
  }
  // If the initiation succeeded, the BTC transaction must be monitored. If
  // present, move it to WITHDRAWAL_SUCCEEDED but if not and the withdrawal is
  // more than 12 hours old, move it to CHALLENGE_READY.
  if (withdrawal.status === BtcWithdrawStatus.TX_CONFIRMED) {
    const vaultIndex = await hemiClient.getVaultChildIndex()
    // if the bitcoinTxId doesn't exists, it returns 0x...0
    const bitcoinTxId = await getBitcoinWithdrawalBitcoinTxId({
      hemiClient,
      uuid: BigInt(withdrawal.uuid),
      vaultIndex,
    })
    if (bitcoinTxId !== bitcoinZeroAddress) {
      return BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED
    }
    const gracePeriod = await getBitcoinWithdrawalGracePeriod({
      hemiClient,
      vaultIndex,
    })
    const age = Math.floor(new Date().getTime() / 1000) - withdrawal.timestamp
    if (age > gracePeriod) {
      return BtcWithdrawStatus.CHALLENGE_READY
    }
  }
  if (
    withdrawal.status === BtcWithdrawStatus.CHALLENGE_READY &&
    withdrawal.challengeTxHash
  ) {
    const receipt = await getEvmTransactionReceipt(
      withdrawal.challengeTxHash,
      withdrawal.l2ChainId,
    )
    if (!receipt) {
      return BtcWithdrawStatus.CHALLENGE_IN_PROGRESS
    }
    return receipt.status === 'success'
      ? BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED
      : BtcWithdrawStatus.CHALLENGE_READY
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
  hemiClient: HemiPublicClient
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
    hemiClient
      .getVaultChildIndex()
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

export const claimBtcDeposit = ({
  deposit,
  from,
  hemiClient,
  hemiWalletClient,
}: {
  deposit: BtcDepositOperation
  from: Address
  hemiClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
}) =>
  Promise.all([
    getVaultIndexByBTCAddress(hemiClient, deposit),
    getVaultAddressByDeposit(hemiClient, deposit).then(vaultAddress =>
      getHemiStatusOfBtcDeposit({ deposit, hemiClient, vaultAddress }),
    ),
    getTransactionReceipt(deposit.transactionHash).then(receipt =>
      calculateDepositOutputIndex(receipt, deposit.to),
    ),
  ]).then(function ([vaultIndex, currentStatus, outputIndex]) {
    if (currentStatus === BtcDepositStatus.BTC_DEPOSITED) {
      throw new Error('Bitcoin Deposit already confirmed')
    }
    if (currentStatus !== BtcDepositStatus.BTC_READY_CLAIM) {
      throw new Error('Bitcoin Deposit is not ready for claim!')
    }

    return hemiWalletClient.confirmDeposit({
      // For current vault implementations, the field is not used... but required by
      // the abi
      extraInfo: '0x',
      from,
      outputIndex: BigInt(outputIndex),
      txId: deposit.transactionHash,
      vaultIndex,
    })
  })

// The withdrawal uuid is a 64-bit number needed to challenge the
// operation if the operator does not process it timely, within 12 hours.
// It is an argument of the WithdrawalInitiated event and can be easily
// read from the receipt logs. The logs must be decoded as viem does not
// seem to do so automatically.
export const getBitcoinWithdrawalUuid = (receipt: TransactionReceipt) =>
  parseEventLogs({ abi: bitcoinTunnelManagerAbi, logs: receipt.logs }).find(
    event => event.eventName === 'WithdrawalInitiated',
  ).args.uuid satisfies bigint

export const initiateBtcWithdrawal = ({
  amount,
  btcAddress,
  from,
  hemiClient,
  hemiWalletClient,
}: {
  amount: bigint
  btcAddress: BtcAccount
  from: Address
  hemiClient: HemiPublicClient
  hemiWalletClient: HemiWalletClient
}) =>
  hemiClient.getVaultChildIndex().then(vaultIndex =>
    hemiWalletClient.initiateWithdrawal({
      amount,
      btcAddress,
      from,
      vaultIndex,
    }),
  )
