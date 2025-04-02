import { EvmDepositStatus, type EvmDepositOperation } from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { watchEvmDeposit } from 'utils/watch/evmDeposits'
import { hemiSepolia, sepolia } from 'viem/chains'
import { getL2TransactionHashes } from 'viem/op-stack'
import { beforeEach, describe, it, expect, vi } from 'vitest'

vi.mock('utils/evmApi', () => ({
  getEvmBlock: vi.fn(),
  getEvmTransactionReceipt: vi.fn(),
}))

vi.mock('viem/op-stack', () => ({
  getL2TransactionHashes: vi.fn(),
}))

// @ts-expect-error only use the minimum required properties
const deposit: EvmDepositOperation = {
  l1ChainId: sepolia.id,
  l2ChainId: hemiSepolia.id,
  status: EvmDepositStatus.DEPOSIT_TX_PENDING,
  transactionHash: '0x0000000000000000000000000000000000000005',
}

const receipt = { blockNumber: BigInt(100), status: 'success' }
const block = { timestamp: BigInt(1630000000) }

describe('watchEvmDeposit', function () {
  beforeEach(function () {
    vi.clearAllMocks()
  })

  it('should not return any update if the transaction is still pending', async function () {
    vi.mocked(getEvmTransactionReceipt).mockResolvedValue(null)

    const updates = await watchEvmDeposit(deposit)

    expect(updates).toStrictEqual({})
    expect(getEvmBlock).not.toHaveBeenCalled()
  })

  it(`should return the new status set to ${EvmDepositStatus.DEPOSIT_TX_CONFIRMED} if the L1 transaction was confirmed but the L2 was not`, async function () {
    vi.mocked(getEvmTransactionReceipt)
      // L1 deposit transaction
      .mockResolvedValueOnce(receipt)
      // L2 transaction
      .mockResolvedValueOnce(null)
    vi.mocked(getEvmBlock).mockResolvedValue(block)
    vi.mocked(getL2TransactionHashes).mockReturnValue([])

    const updates = await watchEvmDeposit(deposit)

    expect(updates.status).toBe(EvmDepositStatus.DEPOSIT_TX_CONFIRMED)
    expect(updates.blockNumber).toBe(Number(receipt.blockNumber))
    expect(updates.timestamp).toBe(Number(block.timestamp))
    expect(getEvmTransactionReceipt).toHaveBeenCalledTimes(2)
    expect(getEvmBlock).toHaveBeenCalledWith(
      receipt.blockNumber,
      deposit.l1ChainId,
    )
  })

  it(`should return the new status set to ${EvmDepositStatus.DEPOSIT_TX_FAILED} if the transaction reverted`, async function () {
    vi.mocked(getEvmTransactionReceipt).mockResolvedValue({
      ...receipt,
      status: 'reverted',
    })
    vi.mocked(getEvmBlock).mockResolvedValue(block)

    const updates = await watchEvmDeposit(deposit)

    expect(updates.status).toBe(EvmDepositStatus.DEPOSIT_TX_FAILED)
    expect(updates.blockNumber).toBe(Number(receipt.blockNumber))
    expect(updates.timestamp).toBe(Number(block.timestamp))
    expect(getEvmTransactionReceipt).toHaveBeenCalledWith(
      deposit.transactionHash,
      deposit.l1ChainId,
    )
    expect(getEvmBlock).toHaveBeenCalledWith(
      receipt.blockNumber,
      deposit.l1ChainId,
    )
  })

  it(`should return the new status set to ${EvmDepositStatus.DEPOSIT_RELAYED} if both the L1 and L2 transactions were confirmed`, async function () {
    const l2TransactionHash = '0x0000000000000000000000000000000000000007'
    vi.mocked(getEvmTransactionReceipt)
      // L1 deposit transaction
      .mockResolvedValueOnce(receipt)
      // L2 transaction
      .mockResolvedValueOnce(receipt)

    vi.mocked(getL2TransactionHashes).mockReturnValue([l2TransactionHash])

    const updates = await watchEvmDeposit({
      ...deposit,
      blockNumber: 100,
      timestamp: new Date().getTime(),
    })

    expect(updates).toStrictEqual({
      l2TransactionHash,
      status: EvmDepositStatus.DEPOSIT_RELAYED,
    })
  })
})
