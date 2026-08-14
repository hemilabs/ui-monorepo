import { type Chain, type Hash } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('utils/chainClients', () => ({
  getPublicClient: vi.fn(),
}))

vi.mock('viem/actions', () => ({
  getBlock: vi.fn(),
  getTransactionReceipt: vi.fn(),
}))

const chainId: Chain['id'] = 1
const otherChainId: Chain['id'] = 10
const hash: Hash =
  '0x0000000000000000000000000000000000000000000000000000000000000001'

// evmApi memoizes public clients in module scope, so each test needs its own
// copy of the module and of the mocks it captured. The client itself is opaque
// here: evmApi only forwards it to the viem actions, so asserting which
// instance they got is what proves the memoization.
const setup = async function () {
  const clients = new Map<Chain['id'], object>()
  const clientFor = function (id: Chain['id']) {
    if (!clients.has(id)) {
      clients.set(id, { chain: id })
    }
    return clients.get(id) as object
  }

  const { getPublicClient } = await import('utils/chainClients')
  vi.mocked(getPublicClient).mockImplementation(
    id => clientFor(id) as ReturnType<typeof getPublicClient>,
  )

  const { getBlock, getTransactionReceipt } = await import('viem/actions')
  vi.mocked(getBlock).mockResolvedValue({ timestamp: BigInt(0) } as never)
  vi.mocked(getTransactionReceipt).mockResolvedValue(null as never)

  const evmApi = await import('utils/evmApi')
  return {
    clientFor,
    evmApi,
    getBlock: vi.mocked(getBlock),
    getPublicClient: vi.mocked(getPublicClient),
    getTransactionReceipt: vi.mocked(getTransactionReceipt),
  }
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
    const { evmApi, getTransactionReceipt } = await setup()
    getTransactionReceipt.mockRejectedValue(notFoundError())

    await expect(
      evmApi.getEvmTransactionReceipt(hash, chainId),
    ).resolves.toBeNull()
  })

  it('should rethrow any other error', async function () {
    const { evmApi, getTransactionReceipt } = await setup()
    getTransactionReceipt.mockRejectedValue(new Error('rpc is down'))

    await expect(
      evmApi.getEvmTransactionReceipt(hash, chainId),
    ).rejects.toThrow('rpc is down')
  })

  it('should reuse the same client across calls to the same chain', async function () {
    const { clientFor, evmApi, getPublicClient, getTransactionReceipt } =
      await setup()

    await evmApi.getEvmTransactionReceipt(hash, chainId)
    await evmApi.getEvmTransactionReceipt(hash, chainId)

    expect(getPublicClient).toHaveBeenCalledExactlyOnceWith(chainId)
    expect(getTransactionReceipt).toHaveBeenCalledTimes(2)
    expect(getTransactionReceipt).toHaveBeenNthCalledWith(
      2,
      clientFor(chainId),
      { hash },
    )
  })

  it('should use a distinct client per chain', async function () {
    const { clientFor, evmApi, getTransactionReceipt } = await setup()

    await evmApi.getEvmTransactionReceipt(hash, chainId)
    await evmApi.getEvmTransactionReceipt(hash, otherChainId)

    expect(clientFor(chainId)).not.toBe(clientFor(otherChainId))
    expect(getTransactionReceipt).toHaveBeenNthCalledWith(
      1,
      clientFor(chainId),
      { hash },
    )
    expect(getTransactionReceipt).toHaveBeenNthCalledWith(
      2,
      clientFor(otherChainId),
      { hash },
    )
  })
})

describe('getEvmBlock', function () {
  it('should convert the block number into a BigInt and go through the memoized client', async function () {
    const { clientFor, evmApi, getBlock } = await setup()
    const block = { timestamp: BigInt(1630000000) }
    getBlock.mockResolvedValue(block as never)

    await expect(evmApi.getEvmBlock(100, chainId)).resolves.toStrictEqual(block)

    expect(getBlock).toHaveBeenCalledExactlyOnceWith(clientFor(chainId), {
      blockNumber: BigInt(100),
    })
  })

  it('should memoize repeated reads of the same block', async function () {
    const { evmApi, getBlock } = await setup()

    await evmApi.getEvmBlock(100, chainId)
    await evmApi.getEvmBlock(100, chainId)

    expect(getBlock).toHaveBeenCalledOnce()
  })

  it('should key the memo by chain, so the same block number does not collide', async function () {
    const { clientFor, evmApi, getBlock } = await setup()

    await evmApi.getEvmBlock(100, chainId)
    await evmApi.getEvmBlock(100, otherChainId)

    expect(getBlock).toHaveBeenCalledTimes(2)
    expect(getBlock).toHaveBeenNthCalledWith(2, clientFor(otherChainId), {
      blockNumber: BigInt(100),
    })
  })
})
