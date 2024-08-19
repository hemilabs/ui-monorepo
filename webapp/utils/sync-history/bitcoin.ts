import { MessageDirection } from '@eth-optimism/sdk'
import { BtcChain } from 'btc-wallet/chains'
import { Account, BtcTransaction } from 'btc-wallet/unisat'
import {
  type HemiPublicClient,
  publicClientToHemiClient,
} from 'hooks/useHemiClient'
import { TransactionListSyncType } from 'hooks/useSyncHistory/types'
import pAll from 'p-all'
import pDoWhilst from 'p-do-whilst'
import { BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { calculateDepositAmount } from 'utils/bitcoin'
import {
  getAddressTransactions,
  MempoolJsBitcoinTransaction,
} from 'utils/btcApi'
import {
  getBitcoinCustodyAddress,
  getVaultAddressByOwner,
  getHemiStatusOfBtcDeposit,
  hemiAddressToBitcoinOpReturn,
} from 'utils/hemi'
import { getNativeToken } from 'utils/token'
import { type Address, createPublicClient, http, toHex } from 'viem'

import { type HistorySyncer } from './types'

const discardKnownTransactions = (toKnownTx?: BtcTransaction) =>
  function (transactions: MempoolJsBitcoinTransaction[]) {
    if (!toKnownTx) {
      return transactions
    }
    const toIndex = transactions.findIndex(tx => tx.txId === toKnownTx)
    if (toIndex === -1) {
      return transactions
    }
    return transactions.filter((_, i) => i < toIndex)
  }

const isValidDeposit = (
  hemiAddress: Address,
  opReturnUtxo: MempoolJsBitcoinTransaction['vout'][number],
) =>
  opReturnUtxo.scriptpubkeyAsm ===
  `OP_RETURN OP_PUSHBYTES_40 ${toHex(
    hemiAddressToBitcoinOpReturn(hemiAddress),
  ).slice(2)}`

const filterDeposits = (
  bitcoinTransactions: MempoolJsBitcoinTransaction[],
  hemiAddress: Address,
  bitcoinCustodyAddress: Account,
) =>
  bitcoinTransactions.filter(function (transaction) {
    // A transaction, in order to be a deposit, needs to have a utxo
    // targeting the bitcoin custody address, and use the OP_RETURN
    // command
    const opReturnUtxo = transaction.vout.find(
      ({ scriptpubkeyType }) => scriptpubkeyType === 'op_return',
    )
    const receiver = transaction.vout.find(
      ({ scriptpubkeyAddress }) =>
        scriptpubkeyAddress === bitcoinCustodyAddress,
    )
    if (!receiver || !opReturnUtxo) {
      return false
    }
    // at this point, it is a TX where the receiver is a custodial address
    // and it is using OP_RETURN, but in order to confirm it is a deposit
    // we need to confirm it has the correct format.
    return isValidDeposit(hemiAddress, opReturnUtxo)
  })

export const createBitcoinSync = function ({
  address: hemiAddress,
  debug,
  depositsSyncInfo,
  l1Chain,
  l2Chain,
  saveHistory,
}: Omit<HistorySyncer<TransactionListSyncType>, 'l1Chain'> & {
  l1Chain: BtcChain
}) {
  const syncDeposits = async function (hemiClient: HemiPublicClient) {
    let localDepositSyncInfo: TransactionListSyncType = {
      ...depositsSyncInfo,
    }
    debug('Getting bitcoin custody address')
    const vaultAddress = await hemiClient
      .getOwner()
      .then(owner => getVaultAddressByOwner(hemiClient, owner))

    const bitcoinCustodyAddress = await getBitcoinCustodyAddress(
      hemiClient,
      vaultAddress,
    )

    debug('Found custody address %s', bitcoinCustodyAddress)

    const getTransactionsBatch = (afterTxId?: string) =>
      getAddressTransactions(
        bitcoinCustodyAddress,
        afterTxId ? { afterTxId } : undefined,
      ).then(discardKnownTransactions(localDepositSyncInfo.toKnownTx))

    const processTransactions = async function (
      unprocessedTransactions: MempoolJsBitcoinTransaction[],
      batchPivotTx?: string,
    ) {
      const bitcoinDeposits = filterDeposits(
        unprocessedTransactions,
        hemiAddress,
        bitcoinCustodyAddress,
      )

      const newDeposits = await pAll(
        bitcoinDeposits.map(
          bitcoinDeposit =>
            async function (): Promise<BtcDepositOperation> {
              const btc = getNativeToken(l1Chain.id)
              const partialDeposit: Omit<BtcDepositOperation, 'status'> = {
                amount: calculateDepositAmount(
                  bitcoinDeposit.vout,
                  bitcoinCustodyAddress,
                ).toString(),
                direction: MessageDirection.L1_TO_L2,
                // vin should all be utxos coming from the same address...
                // not supporting multisig for the time being (although, we are not really using
                // the from field for anything so far)
                from: bitcoinDeposit.vin[0].prevout.scriptpubkeyAddress,
                l1ChainId: l1Chain.id,
                l1Token: btc.address,
                l2ChainId: l2Chain.id,
                l2Token: btc.extensions.bridgeInfo[l2Chain.id].tokenAddress,
                to: bitcoinCustodyAddress,
                transactionHash: bitcoinDeposit.txId,
              }
              const status = bitcoinDeposit.status.confirmed
                ? await getHemiStatusOfBtcDeposit({
                    deposit: partialDeposit,
                    hemiClient,
                    vaultAddress,
                  })
                : BtcDepositStatus.TX_PENDING
              return { ...partialDeposit, status }
            },
        ),
        { concurrency: 3 },
      )
      debug('Got %s new deposits', newDeposits.length)

      const hasSyncToMinTx = unprocessedTransactions.length === 0

      localDepositSyncInfo = {
        ...localDepositSyncInfo,
        fromKnownTx: hasSyncToMinTx
          ? undefined
          : localDepositSyncInfo.fromKnownTx ?? unprocessedTransactions[0].txId,
        hasSyncToMinTx,
        toKnownTx: hasSyncToMinTx
          ? localDepositSyncInfo.fromKnownTx ?? localDepositSyncInfo.toKnownTx
          : localDepositSyncInfo.toKnownTx,
        txPivot: hasSyncToMinTx ? undefined : batchPivotTx,
      }

      saveHistory({
        payload: {
          chainId: l1Chain.id,
          content: newDeposits,
          ...localDepositSyncInfo,
        },
        type: 'sync-deposits',
      })
    }

    let pivotTxId =
      localDepositSyncInfo.txPivot ?? localDepositSyncInfo.fromKnownTx

    return pDoWhilst(
      async function () {
        const formattedTxId = pivotTxId ?? 'last available transaction'
        debug('Getting transactions batch starting from %s', formattedTxId)
        const transactions = await getTransactionsBatch(pivotTxId)

        debug(
          'Found %s transactions starting from %s',
          transactions.length,
          formattedTxId,
        )
        pivotTxId =
          transactions.length > 0 ? transactions.at(-1).txId : undefined

        await processTransactions(transactions, pivotTxId)
        return transactions
      },
      transactions => transactions.length > 0,
    )
  }

  const syncHistory = function () {
    const l2PublicClient = createPublicClient({
      chain: l2Chain,
      transport: http(),
    })

    const hemiClient = publicClientToHemiClient(l2PublicClient)

    return Promise.all([
      syncDeposits(hemiClient).then(() => debug('Deposits sync finished')),
      // syncWithdrawals().then(() => debug('Withdrawals sync finished')),
    ]).then(function () {
      debug('Sync process finished')
    })
  }

  return { syncHistory }
}
