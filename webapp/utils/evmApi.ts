import {
  getBlock,
  getTransactionReceipt as wagmiGetTransactionReceipt,
} from '@wagmi/core'
import { allEvmNetworksWalletConfig } from 'app/context/evmWalletContext'
import pMemoize from 'promise-mem'
import { type Chain, type Hash } from 'viem'

export const getEvmBlock = pMemoize(
  (blockNumber: bigint | number, chainId: Chain['id']) =>
    getBlock(allEvmNetworksWalletConfig, {
      blockNumber: BigInt(blockNumber),
      chainId,
    }),
  { resolver: (blockNumber, chainId) => `${blockNumber}-${chainId}` },
)

export const getEvmTransactionReceipt = (hash: Hash, chainId: Chain['id']) =>
  wagmiGetTransactionReceipt(allEvmNetworksWalletConfig, {
    chainId,
    hash,
  })
