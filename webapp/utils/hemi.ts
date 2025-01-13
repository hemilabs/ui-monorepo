import { WalletConnector } from 'btc-wallet/connectors/types'
import { Account as BtcAccount, Satoshis } from 'btc-wallet/unisat'
import { HemiWalletClient, type HemiPublicClient } from 'hooks/useHemiClient'
import pMemoize from 'promise-mem'
import { BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { type Address } from 'viem'

import { calculateDepositOutputIndex } from './bitcoin'
import { createBtcApi, mapBitcoinNetwork } from './btcApi'

// Max Sanchez note: looks like if we pass in all lower-case hex, Unisat publishes the bytes instead of the string.
// Tunnel for now is only validating the string representation, but update this in the future using
// the all-lower-case-hex way to get the raw bytes published, which is more efficient.
export const hemiAddressToBitcoinOpReturn = (hemiAddress: Address) =>
  hemiAddress.toUpperCase().slice(2)

// Vaults will have only one custody address (at least with current implementation)
export const getBitcoinCustodyAddress = pMemoize(
  (hemiClient: HemiPublicClient, vaultAddress: Address) =>
    hemiClient.getBitcoinCustodyAddress({ vaultAddress }),
  { resolver: (_, vaultAddress) => vaultAddress },
)

export const getVaultAddressByIndex = pMemoize(
  (hemiClient: HemiPublicClient, vaultIndex: number) =>
    hemiClient.getVaultByIndex({ vaultIndex }),
  { resolver: (_, vaultIndex) => vaultIndex },
)

export const getVaultIndexByBTCAddress = pMemoize(
  // remove once se use getVaultIndexByBTCAddress
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (hemiClient: HemiPublicClient, deposit: BtcDepositOperation) =>
    // See https://github.com/hemilabs/ui-monorepo/issues/393
    // We should use hemiClient.getVaultIndexByBTCAddress({ btcAddress: deposit.to }),
    hemiClient.getVaultChildIndex(),
  { resolver: (_, deposit) => `${deposit.l1ChainId}_${deposit.to}` },
)

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

export const confirmBtcDeposit = ({
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
    createBtcApi(mapBitcoinNetwork(deposit.l1ChainId))
      .getTransactionReceipt(deposit.transactionHash)
      .then(receipt => calculateDepositOutputIndex(receipt, deposit.to)),
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
