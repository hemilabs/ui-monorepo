import { TunnelOperation, RawTunnelOperation } from 'types/tunnel'
import { getEvmBlock } from 'utils/evmApi'
import { type Chain } from 'viem'

export const addTimestampToOperation = <T extends TunnelOperation>(
  operation: RawTunnelOperation<T>,
  chainId: Chain['id'],
) =>
  getEvmBlock(operation.blockNumber, chainId).then(
    blockNumber =>
      ({
        ...operation,
        timestamp: Number(blockNumber.timestamp),
      }) as T,
  )
