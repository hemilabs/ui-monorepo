import { BtcChain } from 'btc-wallet/chains'
import { Account, BtcTransaction } from 'btc-wallet/unisat'
import {
  type BlockSyncType,
  type TransactionListSyncType,
} from 'context/tunnelHistoryContext/types'
import { bitcoinTunnelManagerAbi } from 'hemi-viem/contracts'
import { type HemiPublicClient } from 'hooks/useHemiClient'
import pAll from 'p-all'
import pDoWhilst from 'p-do-whilst'
import {
  type BtcDepositOperation,
  BtcDepositStatus,
  BtcWithdrawStatus,
  MessageDirection,
  type ToBtcWithdrawOperation,
} from 'types/tunnel'
import { calculateDepositAmount, getBitcoinTimestamp } from 'utils/bitcoin'
import {
  createBtcApi,
  mapBitcoinNetwork,
  type MempoolJsBitcoinTransaction,
} from 'utils/btcApi'
import { getHemiClient } from 'utils/chainClients'
import {
  getHemiStatusOfBtcDeposit,
  getHemiStatusOfBtcWithdrawal,
  hemiAddressToBitcoinOpReturn,
} from 'utils/hemi'
import {
  getBitcoinCustodyAddress,
  getVaultAddressByIndex,
} from 'utils/hemiMemoized'
import { getNativeToken } from 'utils/nativeToken'
import { getBtcWithdrawals, getLastIndexedBlock } from 'utils/subgraph'
import { type Address, decodeFunctionData, type Hash, toHex } from 'viem'

import { chainConfiguration } from './chainConfiguration'
import { calculateSkip } from './common'
import { createSlidingTransactionList } from './slidingTransactionList'
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

const getWithdrawerBitcoinAddress = ({
  hash,
  hemiClient,
}: {
  hash: Hash
  hemiClient: HemiPublicClient
}) =>
  hemiClient
    .getTransaction({ hash })
    .then(({ input }) =>
      decodeFunctionData({
        abi: bitcoinTunnelManagerAbi,
        data: input,
      }),
    )
    // the bitcoin address can be retrieve from the input data call - it's the 2nd parameter
    .then(({ args }) => args[1])

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

const addMissingInfoFromSubgraph =
  (hemiClient: HemiPublicClient) => (withdrawals: ToBtcWithdrawOperation[]) =>
    pAll(
      withdrawals.map(
        w => async () =>
          Promise.all([
            // Due to a bug in The graph's ability to parse TXs inputs, some withdrawals may not have
            // the "to" field set. For those, we need to add them here
            w.to
              ? Promise.resolve(w.to)
              : getWithdrawerBitcoinAddress({
                  hash: w.transactionHash,
                  hemiClient,
                }),
            // status is always calculated at the present time, so it is not something that's indexed.
            // However, the mere fact that the transaction is indexed, it means that at least, it is
            // on status ${BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED}.
            getHemiStatusOfBtcWithdrawal({
              hemiClient,
              withdrawal: {
                ...w,
                status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
              },
            }),
          ]).then(
            ([to, status]) => ({ ...w, status, to }) as ToBtcWithdrawOperation,
          ),
      ),
      { concurrency: 2 },
    )

export const createBitcoinSync = function ({
  address: hemiAddress,
  debug,
  depositsSyncInfo,
  l1Chain,
  l2Chain,
  saveHistory,
  withdrawalsSyncInfo,
}: Omit<
  HistorySyncer<TransactionListSyncType>,
  'l1Chain' | 'withdrawalsSyncInfo'
> & {
  l1Chain: BtcChain
} & Pick<HistorySyncer<BlockSyncType>, 'withdrawalsSyncInfo'>) {
  const hemiClient = getHemiClient(l2Chain.id)

  const syncDeposits = async function () {
    let localDepositSyncInfo: TransactionListSyncType = {
      ...depositsSyncInfo,
    }

    debug('Getting vault historic indexes')
    const vaultIndexes = await hemiClient.getVaultHistoricVaultIndexes()
    debug(
      'Found %s vault indexes: %s',
      vaultIndexes.length,
      vaultIndexes.join(', '),
    )

    // Process vaults sequentially starting from the last processed vault or the first one
    const startVaultArrayIndex = localDepositSyncInfo.iterationVault
      ? vaultIndexes.findIndex(
          index => index === localDepositSyncInfo.iterationVault,
        )
      : 0

    // If the vault from iterationVault is not found, start from the beginning
    const validStartIndex =
      startVaultArrayIndex === -1 ? 0 : startVaultArrayIndex
    const vaultsToProcess = vaultIndexes.slice(validStartIndex)

    for (const [vaultArrayIndex, vaultIndex] of vaultsToProcess.entries()) {
      debug(
        'Processing vault index %s (%s/%s)',
        vaultIndex,
        vaultArrayIndex + 1,
        vaultsToProcess.length,
      )

      const vaultAddress = await getVaultAddressByIndex(hemiClient, vaultIndex)
      const bitcoinCustodyAddress = await getBitcoinCustodyAddress(
        hemiClient,
        vaultAddress,
      )

      debug(
        'Found custody address %s for vault %s',
        bitcoinCustodyAddress,
        vaultIndex,
      )

      const getTransactionsBatch = async function (afterTxId?: string) {
        const formattedTxId = afterTxId ?? 'last available transaction'
        debug(
          'Getting transactions batch starting from %s for vault %s',
          formattedTxId,
          vaultIndex,
        )

        // Add delay to be gentle with the Mempool API - so it does not block us.
        await new Promise(resolve => setTimeout(resolve, 500))

        const transactions = await createBtcApi(mapBitcoinNetwork(l1Chain.id))
          .getAddressTransactions(
            bitcoinCustodyAddress,
            afterTxId ? { afterTxId } : undefined,
          )
          .then(discardKnownTransactions(localDepositSyncInfo.toKnownTx))

        debug(
          'Found %s transactions starting from %s for vault %s',
          transactions.length,
          formattedTxId,
          vaultIndex,
        )
        return transactions
      }

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
                  timestamp: bitcoinDeposit.status.blockTime
                    ? getBitcoinTimestamp(bitcoinDeposit.status.blockTime)
                    : undefined,
                  to: bitcoinCustodyAddress,
                  transactionHash: bitcoinDeposit.txId,
                }
                const status = bitcoinDeposit.status.confirmed
                  ? await getHemiStatusOfBtcDeposit({
                      deposit: partialDeposit,
                      hemiClient,
                      vaultAddress,
                    })
                  : BtcDepositStatus.BTC_TX_PENDING
                return { ...partialDeposit, status }
              },
          ),
          { concurrency: 3 },
        )
        debug(
          'Got %s new deposits for vault %s',
          newDeposits.length,
          vaultIndex,
        )

        // This means we finished requesting TXs from the history for this vault
        const hasVaultSyncToMinTx = unprocessedTransactions.length === 0

        // Check if we've processed all vaults and reached minTx for all of them
        const isLastVault = vaultArrayIndex === vaultsToProcess.length - 1
        const hasSyncToMinTx = hasVaultSyncToMinTx && isLastVault

        localDepositSyncInfo = {
          ...localDepositSyncInfo,
          fromKnownTx: hasVaultSyncToMinTx
            ? undefined
            : localDepositSyncInfo.fromKnownTx ??
              unprocessedTransactions[0].txId,
          hasSyncToMinTx,
          // Track which vault we're currently processing - store the vault index (ID), not array position
          iterationVault: hasSyncToMinTx ? undefined : vaultIndex,
          // Once we sync up to the oldest transaction, next time we will only sync up to this point
          toKnownTx: hasVaultSyncToMinTx
            ? localDepositSyncInfo.fromKnownTx ?? localDepositSyncInfo.toKnownTx
            : localDepositSyncInfo.toKnownTx,
          // store it in case we need to restart the sync from a specific point, otherwise undefined
          txPivot: hasVaultSyncToMinTx ? undefined : batchPivotTx,
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

      await createSlidingTransactionList({
        getTransactionsBatch,
        // Reset pivotTxId for each new vault - only use saved pivot if we're continuing the same vault
        pivotTxId:
          localDepositSyncInfo.iterationVault === vaultIndex
            ? depositsSyncInfo.txPivot ?? depositsSyncInfo.fromKnownTx
            : undefined,
        processTransactions,
        // caller of this function checks transactions is .length > 0, so there will always be a last option
        txIdGetter: transactions => transactions.at(-1)!.txId,
      }).run()

      debug('Finished processing vault %s', vaultIndex)
    }
  }

  const syncWithdrawals = async function () {
    // Get this before reading the Subgraph, to ensure next time we don't miss some blocks due
    // to some race condition.
    const lastIndexedBlock = await getLastIndexedBlock(l2Chain.id)

    const shouldQueryWithdrawals = (limit: number, withdrawalsAmount: number) =>
      limit === withdrawalsAmount

    const initialFromBlock =
      withdrawalsSyncInfo.fromBlock ??
      // or the oldest block configured for this chain, if it is the first time
      chainConfiguration[l2Chain.id].minBlockToSync ??
      // or bring everything! (just for type-safety, but should never occur)
      0

    // As awful as it is, graph-node doesn't support cursor pagination (which is the
    // recommended way to paginate in graphQL). It also doesn't support a way to natively get
    // the amount of Entities saved in the subgraph. As the UI use a infinite scrolling pagination,
    // we don't need to "list" the total of operations. However, in order to load deposits, our best option
    // is to use limit/skip and keep querying until less entities than the $limit are returned.
    // See https://github.com/graphprotocol/graph-node/issues/613 and
    // https://github.com/graphprotocol/graph-node/issues/1309

    await pDoWhilst(
      async function ({
        fromBlock,
        limit,
        skip,
      }: {
        fromBlock: number
        limit: number
        skip: number
        withdrawals: ToBtcWithdrawOperation[]
      }) {
        const newWithdrawals = await getBtcWithdrawals({
          address: hemiAddress,
          chainId: l2Chain.id,
          // from the oldest block we've queried before
          fromBlock,
          limit,
          skip,
        }).then(addMissingInfoFromSubgraph(hemiClient))

        saveHistory({
          payload: {
            chainId: l1Chain.id,
            chunkIndex: shouldQueryWithdrawals(limit, newWithdrawals.length)
              ? skip
              : 0,
            content: newWithdrawals,
            // only update the "fromBlock" if we have finished querying all deposits. Otherwise
            // we may miss some deposits. Once all were loaded, and saved in local storage, next time
            // we can start querying again from the current last indexed block of the subgraph
            fromBlock: shouldQueryWithdrawals(limit, newWithdrawals.length)
              ? fromBlock
              : lastIndexedBlock + 1,
          },
          type: 'sync-withdrawals',
        })

        return {
          fromBlock,
          limit,
          withdrawals: newWithdrawals,
          ...calculateSkip({
            limit,
            operations: newWithdrawals,
            skip,
          }),
        }
      },
      ({ limit, withdrawals }) =>
        shouldQueryWithdrawals(limit, withdrawals.length),
      {
        fromBlock: initialFromBlock,
        limit: 100,
        skip: withdrawalsSyncInfo.chunkIndex ?? 0,
        withdrawals: [],
      },
    )
  }

  const syncHistory = async function () {
    await Promise.all([
      syncDeposits().then(() => debug('Deposits sync finished')),
      syncWithdrawals().then(() => debug('Withdrawals sync finished')),
    ])

    debug('Sync process finished')
  }

  return { syncHistory }
}
