import { getBlock } from '@wagmi/core'
import { evmWalletConfig } from 'app/context/evmWalletContext'
import pMemoize from 'promise-mem'
import { type Chain } from 'viem'

export const getEvmBlock = pMemoize(
  (blockNumber: bigint | number, chainId: Chain['id']) =>
    getBlock(evmWalletConfig, {
      blockNumber: BigInt(blockNumber),
      chainId,
    }),
  { resolver: (blockNumber, chainId) => `${blockNumber}-${chainId}` },
)
