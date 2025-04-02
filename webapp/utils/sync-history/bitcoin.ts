import { featureFlags } from 'app/featureFlags'
import { BtcChain } from 'btc-wallet/chains'
import { Account, BtcTransaction } from 'btc-wallet/unisat'
import { bitcoinTunnelManagerAbi } from 'hemi-viem/contracts'
import { type HemiPublicClient } from 'hooks/useHemiClient'
import {
  type BlockSyncType,
  type TransactionListSyncType,
} from 'hooks/useSyncHistory/types'
import pAll from 'p-all'
import pDoWhilst from 'p-do-whilst'
import pThrottle from 'p-throttle'
import {
  createSlidingBlockWindow,
  CreateSlidingBlockWindow,
} from 'sliding-block-window/src'
import { type EvmChain } from 'types/chain'
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
import { getEvmBlock } from 'utils/evmApi'
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
import { createProvider } from 'utils/providers'
import { getBtcWithdrawals, getLastIndexedBlock } from 'utils/subgraph'
import {
  type Address,
  decodeFunctionData,
  type Hash,
  type Log,
  parseAbiItem,
  toHex,
  zeroAddress,
} from 'viem'

import { chainConfiguration } from './chainConfiguration'
import { getBlockNumber, getBlockPayload } from './common'
import { createSlidingTransactionList } from './slidingTransactionList'
import { type HistorySyncer } from './types'

const throttlingOptions = { interval: 2000, limit: 1, strict: true }

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
    .then(args => args[1] as string)

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

const addAdditionalInfo =
  (hemiClient: HemiPublicClient) =>
  (withdrawals: Omit<ToBtcWithdrawOperation, 'to'>[]) =>
    pAll(
      withdrawals.map(
        // pAll only infers the return type correctly if the function is async
        w => async () =>
          Promise.all([
            getWithdrawerBitcoinAddress({
              hash: w.transactionHash,
              hemiClient,
            }),
            getEvmBlock(w.blockNumber, w.l2ChainId),
          ])
            .then(
              ([btcAddress, block]) =>
                ({
                  ...w,
                  timestamp: Number(block.timestamp),
                  to: btcAddress,
                }) satisfies ToBtcWithdrawOperation,
            )
            .then(withdrawal =>
              // status requires the timestamp to be defined, so this step must be done at last
              getHemiStatusOfBtcWithdrawal({
                hemiClient,
                // only value missing is "to", which is not used internally.
                withdrawal: withdrawal as ToBtcWithdrawOperation,
              }).then(
                status =>
                  ({
                    ...withdrawal,
                    status,
                  }) satisfies ToBtcWithdrawOperation,
              ),
            ),
      ),
      { concurrency: 2 },
    )

const withdrawalInitiatedAbiEvent = parseAbiItem(
  'event WithdrawalInitiated(address indexed vault, address indexed withdrawer, string indexed btcAddress, uint256 withdrawalSats, uint256 netSatsAfterFee, uint64 uuid)',
)

const getWithdrawalsLogs = ({
  fromBlock,
  hemiAddress,
  hemiClient,
  toBlock,
}: {
  fromBlock: number
  hemiAddress: Address
  hemiClient: HemiPublicClient
  toBlock: number
}) =>
  hemiClient.getLogs({
    args: {
      withdrawer: hemiAddress,
    },
    event: withdrawalInitiatedAbiEvent,
    fromBlock: BigInt(fromBlock),
    toBlock: BigInt(toBlock),
  })

const logsToWithdrawals =
  ({
    hemiAddress,
    l1Chain,
    l2Chain,
  }: {
    hemiAddress: Address
    l1Chain: BtcChain
    l2Chain: EvmChain
  }) =>
  (logs: Log<bigint, number, false, typeof withdrawalInitiatedAbiEvent>[]) =>
    logs.map(
      ({ args, blockNumber, transactionHash }) =>
        ({
          amount: args.withdrawalSats.toString(),
          blockNumber: Number(blockNumber),
          direction: MessageDirection.L2_TO_L1,
          from: hemiAddress,
          l1ChainId: l1Chain.id,
          l1Token: zeroAddress,
          l2ChainId: l2Chain.id,
          l2Token: getNativeToken(l1Chain.id).extensions.bridgeInfo[l2Chain.id]
            .tokenAddress,
          // as logs are found, the tx is confirmed. So TX_CONFIRMED is the min status.
          status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
          transactionHash,
          uuid: args.uuid.toString(),
        }) satisfies Omit<ToBtcWithdrawOperation, 'to'>,
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

  const getBitcoinWithdrawals = ({
    fromBlock,
    toBlock,
  }: {
    fromBlock: number
    toBlock: number
  }) =>
    getWithdrawalsLogs({
      fromBlock,
      hemiAddress,
      hemiClient,
      toBlock,
    })
      .then(logsToWithdrawals({ hemiAddress, l1Chain, l2Chain }))
      .then(addAdditionalInfo(hemiClient))

  const syncDeposits = async function () {
    let localDepositSyncInfo: TransactionListSyncType = {
      ...depositsSyncInfo,
    }
    debug('Getting bitcoin custody address')
    const vaultAddress = await hemiClient
      .getVaultChildIndex()
      .then(vaultIndex => getVaultAddressByIndex(hemiClient, vaultIndex))

    const bitcoinCustodyAddress = await getBitcoinCustodyAddress(
      hemiClient,
      vaultAddress,
    )

    debug('Found custody address %s', bitcoinCustodyAddress)

    const getTransactionsBatch = async function (afterTxId?: string) {
      const formattedTxId = afterTxId ?? 'last available transaction'
      debug('Getting transactions batch starting from %s', formattedTxId)

      const transactions = await createBtcApi(mapBitcoinNetwork(l1Chain.id))
        .getAddressTransactions(
          bitcoinCustodyAddress,
          afterTxId ? { afterTxId } : undefined,
        )
        .then(discardKnownTransactions(localDepositSyncInfo.toKnownTx))

      debug(
        'Found %s transactions starting from %s',
        transactions.length,
        formattedTxId,
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
                timestamp: getBitcoinTimestamp(bitcoinDeposit.status.blockTime),
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
      debug('Got %s new deposits', newDeposits.length)

      // This means we finished requesting TXs from the history
      const hasSyncToMinTx = unprocessedTransactions.length === 0

      localDepositSyncInfo = {
        ...localDepositSyncInfo,
        fromKnownTx: hasSyncToMinTx
          ? undefined
          : localDepositSyncInfo.fromKnownTx ?? unprocessedTransactions[0].txId,
        hasSyncToMinTx,
        // Once we sync up to the oldest transaction, next time we will only sync up to this point
        toKnownTx: hasSyncToMinTx
          ? localDepositSyncInfo.fromKnownTx ?? localDepositSyncInfo.toKnownTx
          : localDepositSyncInfo.toKnownTx,
        // store it in case we need to restart the sync from a specific point, otherwise undefined
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

    return createSlidingTransactionList({
      getTransactionsBatch,
      pivotTxId: depositsSyncInfo.txPivot ?? depositsSyncInfo.fromKnownTx,
      processTransactions,
      txIdGetter: transactions => transactions.at(-1).txId,
    }).run()
  }

  const syncWithdrawalsWithOpSdk = async function () {
    const lastBlock = await getBlockNumber(
      withdrawalsSyncInfo.toBlock,
      createProvider(l2Chain),
    )

    const initialBlock =
      withdrawalsSyncInfo.fromBlock ?? withdrawalsSyncInfo.minBlockToSync ?? 0

    debug(
      'Syncing withdrawals between blocks %s and %s',
      initialBlock,
      lastBlock,
    )

    const onChange = async function ({
      canMove,
      nextState,
      state,
    }: Parameters<CreateSlidingBlockWindow['onChange']>[0]) {
      // we walk the blockchain backwards, but OP API expects
      // toBlock > fromBlock - so we must invert them
      const { from: toBlock, to: fromBlock, windowIndex } = state

      debug(
        'Getting deposits from block %s to %s (windowIndex %s)',
        fromBlock,
        toBlock,
        windowIndex,
      )

      const newWithdrawals = await getBitcoinWithdrawals({
        fromBlock,
        toBlock,
      })

      debug(
        'Got %s withdrawals from block %s to %s (windowIndex %s). Saving',
        newWithdrawals.length,
        fromBlock,
        toBlock,
        windowIndex,
      )

      // save the withdrawals
      saveHistory({
        payload: {
          ...getBlockPayload({
            canMove,
            fromBlock: withdrawalsSyncInfo.fromBlock,
            lastBlock,
            nextState,
          }),
          chainId: l1Chain.id,
          content: newWithdrawals,
        },
        type: 'sync-withdrawals',
      })
    }

    return createSlidingBlockWindow({
      initialBlock,
      lastBlock,
      onChange: pThrottle(throttlingOptions)(onChange),
      windowIndex: withdrawalsSyncInfo.chunkIndex,
      windowSize: withdrawalsSyncInfo.blockWindowSize,
    }).run()
  }

  const syncWithdrawalsWithSubgraph = async function () {
    // Get this before reading the Subgraph, to ensure next time we don't miss some blocks due
    // to some race condition.
    const lastIndexedBlock = await getLastIndexedBlock(l2Chain.id)

    const shouldQueryWithdrawals = (limit: number, withdrawalsAmount: number) =>
      limit === withdrawalsAmount

    const fromBlock =
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
        limit,
        skip,
      }: {
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
            // TODO once feature flag is removed, this field is no longer needed.
            // See https://github.com/hemilabs/ui-monorepo/issues/743
            hasSyncToMinBlock: true,
            toBlock: undefined,
          },
          type: 'sync-withdrawals',
        })

        return {
          limit,
          skip: skip + limit,
          withdrawals: newWithdrawals,
        }
      },
      ({ limit, withdrawals }) =>
        shouldQueryWithdrawals(limit, withdrawals.length),
      {
        limit: 100,
        skip: withdrawalsSyncInfo.chunkIndex ?? 0,
        withdrawals: [],
      },
    )
  }

  const syncWithdrawals = () =>
    featureFlags.syncHistoryWithdrawalsWithSubgraph
      ? syncWithdrawalsWithSubgraph()
      : syncWithdrawalsWithOpSdk()

  const syncHistory = async function () {
    await Promise.all([
      syncDeposits().then(() => debug('Deposits sync finished')),
      syncWithdrawals().then(() => debug('Withdrawals sync finished')),
    ])

    debug('Sync process finished')
  }

  return { syncHistory }
}
