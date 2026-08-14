import pMemoize from 'promise-mem'
import { getPublicClient } from 'utils/chainClients'
import { type Chain, type Hash, type TransactionReceipt } from 'viem'

const clients = new Map<Chain['id'], ReturnType<typeof getPublicClient>>()

// buildTransport() wires an eth-rpc-cache whose state lives inside the
// transport, so a fresh client per call would never hit the cache.
const getClient = function (chainId: Chain['id']) {
  const existing = clients.get(chainId)
  if (existing) {
    return existing
  }
  const client = getPublicClient(chainId)
  clients.set(chainId, client)
  return client
}

export const getEvmBlock = pMemoize(
  (blockNumber: bigint | number, chainId: Chain['id']) =>
    getClient(chainId).getBlock({ blockNumber: BigInt(blockNumber) }),
  { resolver: (blockNumber, chainId) => `${blockNumber}-${chainId}` },
)

export const getEvmTransactionReceipt = (
  hash: Hash,
  chainId: Chain['id'],
): Promise<TransactionReceipt | null> =>
  getClient(chainId)
    .getTransactionReceipt({ hash })
    .catch(function (err) {
      // Do nothing if the TX was not found, as that throws
      if (err.name === 'TransactionReceiptNotFoundError') {
        return null
      }
      throw err
    })
