import {
  getBlock,
  getTransactionReceipt as wagmiGetTransactionReceipt,
} from '@wagmi/core'
import { allEvmNetworksWalletConfig } from 'context/evmWalletContext'
import pMemoize from 'promise-mem'
import { type Chain, type Hash, type TransactionReceipt } from 'viem'

export const getEvmBlock = pMemoize(
  (blockNumber: bigint | number, chainId: Chain['id']) =>
    getBlock(allEvmNetworksWalletConfig, {
      blockNumber: BigInt(blockNumber),
      chainId,
    }),
  { resolver: (blockNumber, chainId) => `${blockNumber}-${chainId}` },
)

export const getEvmTransactionReceipt = (
  hash: Hash,
  chainId: Chain['id'],
): Promise<TransactionReceipt | null> =>
  wagmiGetTransactionReceipt(allEvmNetworksWalletConfig, {
    chainId,
    hash,
  }).catch(function (err) {
    // Do nothing if the TX was not found, as that throws
    if (err.name === 'TransactionReceiptNotFoundError') {
      return null
    }
    throw err
  })
