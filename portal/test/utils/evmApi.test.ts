import { type Chain, type Hash } from 'viem'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

vi.mock('utils/chainClients', () => ({
  getPublicClient: vi.fn(),
}))

type MockedClient = {
  getBlock: Mock
  getTransactionReceipt: Mock
}

const chainId: Chain['id'] = 1
const otherChainId: Chain['id'] = 10
const hash: Hash =
  '0x0000000000000000000000000000000000000000000000000000000000000001'

const createClient = () => ({
  getBlock: vi.fn().mockResolvedValue({ timestamp: BigInt(0) }),
  getTransactionReceipt: vi.fn().mockResolvedValue(null),
})

// evmApi memoizes public clients in module scope, so each test needs its own
// copy of the module - and of the mocked factory it captured.
const setup = async function () {
  const clients = new Map<Chain['id'], MockedClient>()
  // Get-or-create, so a test can stub a client without that lookup counting as
  // a call to the factory under assertion.
  const clientFor = function (id: Chain['id']) {
    if (!clients.has(id)) {
      clients.set(id, createClient())
    }
    return clients.get(id) as MockedClient
  }

  const { getPublicClient } = await import('utils/chainClients')
  vi.mocked(getPublicClient).mockImplementation(
    id => clientFor(id) as unknown as ReturnType<typeof getPublicClient>,
  )

  const evmApi = await import('utils/evmApi')
  return { clientFor, evmApi, getPublicClient: vi.mocked(getPublicClient) }
}

const notFoundError = function () {
  const error = new Error('Transaction receipt not found')
  error.name = 'TransactionReceiptNotFoundError'
  return error
}

beforeEach(function () {
  vi.resetModules()
})

describe('getEvmTransactionReceipt', function () {
  it('should return null when the receipt is not found', async function () {
    const { clientFor, evmApi } = await setup()
    clientFor(chainId).getTransactionReceipt.mockRejectedValue(notFoundError())

    await expect(
      evmApi.getEvmTransactionReceipt(hash, chainId),
    ).resolves.toBeNull()
  })

  it('should rethrow any other error', async function () {
    const { clientFor, evmApi } = await setup()
    clientFor(chainId).getTransactionReceipt.mockRejectedValue(
      new Error('rpc is down'),
    )

    await expect(
      evmApi.getEvmTransactionReceipt(hash, chainId),
    ).rejects.toThrow('rpc is down')
  })

  it('should reuse the same client across calls to the same chain', async function () {
    const { clientFor, evmApi, getPublicClient } = await setup()

    await evmApi.getEvmTransactionReceipt(hash, chainId)
    await evmApi.getEvmTransactionReceipt(hash, chainId)

    expect(getPublicClient).toHaveBeenCalledExactlyOnceWith(chainId)
    expect(clientFor(chainId).getTransactionReceipt).toHaveBeenCalledTimes(2)
  })

  it('should use a distinct client per chain', async function () {
    const { clientFor, evmApi } = await setup()

    await evmApi.getEvmTransactionReceipt(hash, chainId)
    await evmApi.getEvmTransactionReceipt(hash, otherChainId)

    expect(clientFor(chainId)).not.toBe(clientFor(otherChainId))
    expect(
      clientFor(chainId).getTransactionReceipt,
    ).toHaveBeenCalledExactlyOnceWith({ hash })
    expect(
      clientFor(otherChainId).getTransactionReceipt,
    ).toHaveBeenCalledExactlyOnceWith({ hash })
  })
})

describe('getEvmBlock', function () {
  it('should convert the block number into a BigInt and go through the memoized client', async function () {
    const { clientFor, evmApi } = await setup()
    const block = { timestamp: BigInt(1630000000) }
    clientFor(chainId).getBlock.mockResolvedValue(block)

    await expect(evmApi.getEvmBlock(100, chainId)).resolves.toStrictEqual(block)

    expect(clientFor(chainId).getBlock).toHaveBeenCalledExactlyOnceWith({
      blockNumber: BigInt(100),
    })
  })

  it('should memoize repeated reads of the same block', async function () {
    const { clientFor, evmApi } = await setup()
    clientFor(chainId).getBlock.mockResolvedValue({ timestamp: BigInt(1) })

    await evmApi.getEvmBlock(100, chainId)
    await evmApi.getEvmBlock(100, chainId)

    expect(clientFor(chainId).getBlock).toHaveBeenCalledOnce()
  })

  it('should key the memo by chain, so the same block number does not collide', async function () {
    const { clientFor, evmApi } = await setup()
    clientFor(chainId).getBlock.mockResolvedValue({ timestamp: BigInt(1) })
    clientFor(otherChainId).getBlock.mockResolvedValue({ timestamp: BigInt(2) })

    await evmApi.getEvmBlock(100, chainId)
    await evmApi.getEvmBlock(100, otherChainId)

    expect(clientFor(chainId).getBlock).toHaveBeenCalledOnce()
    expect(clientFor(otherChainId).getBlock).toHaveBeenCalledOnce()
  })
})
