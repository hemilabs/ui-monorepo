import { WalletConnector } from 'btc-wallet/connectors/types'
import { Account as BtcAccount, Satoshis } from 'btc-wallet/unisat'
import { HemiWalletClient, type HemiPublicClient } from 'hooks/useHemiClient'
import pMemoize from 'promise-mem'
import { BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { type Address } from 'viem'

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

// Many vaults will likely share the same owner, so this can be memoized
const getVaultOwnerByBtcAddress = pMemoize(
  (hemiClient: HemiPublicClient, deposit: BtcDepositOperation) =>
    hemiClient.getVaultOwnerByBTCAddress({ btcAddress: deposit.to }),
  { resolver: (_, deposit) => `${deposit.l1ChainId}_${deposit.to}` },
)

// Many deposits will likely share a vault, so this can be memoized
export const getVaultAddressByOwner = pMemoize(
  (hemiClient: HemiPublicClient, ownerAddress: Address) =>
    hemiClient.getVaultAddressByOwner({ ownerAddress }),
  { resolver: (_, vaultOwner) => vaultOwner },
)

export const getVaultAddressByDeposit = (
  hemiClient: HemiPublicClient,
  deposit: BtcDepositOperation,
) =>
  // from the address where the user sends its bitcoin, get the Owner of the vault address in Hemi
  getVaultOwnerByBtcAddress(hemiClient, deposit)
    // with that, get the vault address in Hemi
    .then(ownerAddress => getVaultAddressByOwner(hemiClient, ownerAddress))

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
    // check if Hemi is aware of the btc transaction
    hemiClient
      .getTransactionByTxId({
        txId: deposit.transactionHash,
      })
      // api throws if not found
      .catch(() => undefined)
      .then(txFound => !!txFound),
    // check if the deposit's been confirmed
    hemiClient.acknowledgedDeposits({
      txId: deposit.transactionHash,
      vaultAddress,
    }),
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
      .getOwner()
      // get vault address which will custody the btc
      .then(ownerAddress => getVaultAddressByOwner(hemiClient, ownerAddress))
      // get the bitcoin address which the vault will monitor
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
    getVaultOwnerByBtcAddress(hemiClient, deposit),
    // pull the status again, not from memory, but from reading the contracts
    // in case it just happened to be confirmed outside of the app a few seconds before claiming
    getVaultAddressByDeposit(hemiClient, deposit).then(vaultAddress =>
      getHemiStatusOfBtcDeposit({ deposit, hemiClient, vaultAddress }),
    ),
  ]).then(function ([ownerAddress, currentStatus]) {
    if (currentStatus === BtcDepositStatus.BTC_DEPOSITED) {
      throw new Error('Bitcoin Deposit already confirmed')
    }
    if (currentStatus !== BtcDepositStatus.BTC_READY_CLAIM) {
      throw new Error('Bitcoin Deposit is not ready for claim!')
    }

    return hemiWalletClient.confirmDeposit({
      from,
      ownerAddress,
      txId: deposit.transactionHash,
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
  hemiClient.getOwner().then(ownerAddress =>
    hemiWalletClient.initiateWithdrawal({
      amount,
      btcAddress,
      from,
      ownerAddress,
    }),
  )
