import {
  getBlock,
  getTransactionReceipt as wagmiGetTransactionReceipt,
  readContract,
} from '@wagmi/core'
import { allEvmNetworksWalletConfig } from 'app/context/evmWalletContext'
import pMemoize from 'promise-mem'
import { type L2Token, Token } from 'types/token'
import {
  type Address,
  type Chain,
  type Hash,
  erc20Abi,
  type TransactionReceipt,
  checksumAddress as toChecksum,
} from 'viem'

import { opErc20Abi } from './opErc20Abi'

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

export const getErc20Token = pMemoize(
  async function (address: Address, chainId: Chain['id']) {
    const read = <T extends 'decimals' | 'name' | 'symbol'>(functionName: T) =>
      readContract(allEvmNetworksWalletConfig, {
        abi: erc20Abi,
        address,
        chainId,
        functionName,
      })

    return Promise.all([read('decimals'), read('name'), read('symbol')]).then(
      ([decimals, name, symbol]) =>
        ({
          address: toChecksum(address, chainId),
          chainId,
          decimals,
          name,
          symbol,
        }) satisfies Token,
    )
  },
  { resolver: (address, chainId) => `${address}-${chainId}` },
)

export const getL2Erc20Token = pMemoize(
  async (address: Address, chainId: Chain['id']) =>
    Promise.all([
      getErc20Token(address, chainId),
      readContract(allEvmNetworksWalletConfig, {
        abi: opErc20Abi,
        address,
        chainId,
        functionName: 'l1Token',
      }),
    ]).then(
      ([token, l1Token]) =>
        ({
          ...token,
          address,
          l1Token: toChecksum(l1Token, chainId),
        }) as L2Token,
    ),
  { resolver: (address, chainId) => `${address}-${chainId}` },
)
