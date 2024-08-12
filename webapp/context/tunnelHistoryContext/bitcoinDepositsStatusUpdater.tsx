import { useQuery } from '@tanstack/react-query'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useHemiClient } from 'hooks/useHemiClient'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import PQueue from 'p-queue'
import { BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { getTransactionReceipt } from 'utils/btcApi'
import { getHemiStatusOfBtcDeposit } from 'utils/hemi'
import { useAccount } from 'wagmi'

// concurrently avoid overloading both blockchains
const bitcoinQueue = new PQueue({ concurrency: 5 })
const hemiQueue = new PQueue({ concurrency: 5 })

const WatchBitcoinBlockchain = function ({
  deposit,
}: {
  deposit: BtcDepositOperation
}) {
  const { updateDeposit } = useTunnelHistory()
  useQuery({
    // shouldn't be needed, but let's be safe and avoid extra requests
    // if somehow deposits that are not pending end up here
    enabled: deposit.status === BtcDepositStatus.TX_PENDING,
    queryFn: () =>
      bitcoinQueue.add(() =>
        getTransactionReceipt(deposit.transactionHash).then(function (receipt) {
          if (receipt.status.confirmed) {
            updateDeposit(deposit, { status: BtcDepositStatus.TX_CONFIRMED })
          }
          return receipt.status.confirmed
        }),
      ),
    queryKey: [
      'btc-deposit-tx-status',
      deposit.l1ChainId,
      deposit.transactionHash,
    ],
    // every 30 seconds - once status changes, this component won't render anymore
    // so this hook won't need to "refetch"
    refetchInterval: 30 * 1000,
  })
  return null
}

const WatchHemiBlockchain = function ({
  deposit,
}: {
  deposit: BtcDepositOperation
}) {
  const hemiClient = useHemiClient()
  const { updateDeposit } = useTunnelHistory()

  useQuery({
    // shouldn't be needed, but let's be safe and avoid extra requests
    // if somehow deposits that are not pending end up here
    enabled: [
      BtcDepositStatus.TX_CONFIRMED,
      BtcDepositStatus.BTC_READY_CLAIM,
    ].includes(deposit.status),
    queryFn: () =>
      hemiQueue.add(() =>
        getHemiStatusOfBtcDeposit(hemiClient, deposit).then(
          function (newStatus) {
            if (deposit.status !== newStatus) {
              updateDeposit(deposit, { status: newStatus })
            }
            return newStatus
          },
        ),
      ),
    queryKey: ['btc-deposit-hemi-tx-status', deposit.transactionHash],
    // every 30 seconds - once status changes, this component won't render anymore
    // so this hook won't need to "refetch"
    refetchInterval: 30 * 1000,
  })

  return null
}

const byTimestampDesc = function (
  a: BtcDepositOperation,
  b: BtcDepositOperation,
) {
  if (a.status === b.status) {
    return b.timestamp - a.timestamp
  }
  return (a.status ?? -1) - (b.status ?? -1)
}

export const BitcoinDepositsStatusUpdater = function () {
  // Deposits are checked against Hemi network, but by being connected to any evm wallet
  // we can retrieve the deposits, as they are made to an EVM address
  const { isConnected } = useAccount()
  const deposits = useBtcDeposits()

  if (!isConnected) {
    return null
  }

  // Here, btc transactions have not been confirmed, so we must check it
  // in the bitcoin blockchain
  const depositsToWatchInBitcoin = deposits
    .filter(deposit => deposit.status === BtcDepositStatus.TX_PENDING)
    // put those undefined statuses first
    // but then sorted by timestamp (newest first)
    .sort(byTimestampDesc)

  // Here, bitcoin transactions have been confirmed, so we must watch
  // on the Hemi network for its status
  const depositsToWatchInHemi = deposits
    .filter(deposit =>
      [
        BtcDepositStatus.TX_CONFIRMED,
        BtcDepositStatus.BTC_READY_CLAIM,
      ].includes(deposit.status),
    )
    .sort(byTimestampDesc)

  return (
    <>
      {depositsToWatchInBitcoin.map(deposit => (
        <WatchBitcoinBlockchain
          deposit={deposit}
          key={deposit.transactionHash}
        />
      ))}
      {depositsToWatchInHemi.map(deposit => (
        <WatchHemiBlockchain deposit={deposit} key={deposit.transactionHash} />
      ))}
    </>
  )
}
