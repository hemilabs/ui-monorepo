import { EvmDepositStatus, type EvmDepositOperation } from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { watchEvmDeposit } from 'utils/watch/evmDeposits'
import { hemiSepolia, sepolia } from 'viem/chains'
import { describe, it, expect, vi } from 'vitest'

vi.mock('utils/evmApi', () => ({
  getEvmBlock: vi.fn(),
  getEvmTransactionReceipt: vi.fn(),
}))

vi.mock('eth-rpc-cache', () => ({
  createEthRpcCache: vi.fn(() => ({
    request: vi.fn(),
  })),
  perBlockStrategy: vi.fn(),
  permanentStrategy: vi.fn(),
}))

vi.mock('utils/crossChainMessenger', () => ({
  createQueuedCrossChainMessenger: vi.fn(() => ({
    getMessageStatus: vi.fn(() => 0),
  })),
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
  it('should not return any update if the transaction is still pending', async function () {
    vi.mocked(getEvmTransactionReceipt).mockResolvedValue(null)
    const updates = await watchEvmDeposit(deposit)
    expect(updates).toEqual({})
    expect(getEvmBlock).not.toHaveBeenCalled()
  })
  it(`should return the new status set to ${EvmDepositStatus.DEPOSIT_TX_CONFIRMED} if the transaction was confirmed`, async function () {
    vi.mocked(getEvmTransactionReceipt).mockResolvedValue(receipt)
    vi.mocked(getEvmBlock).mockResolvedValue(block)
    const updates = await watchEvmDeposit(deposit)
    expect(updates.status).toBe(EvmDepositStatus.DEPOSIT_TX_CONFIRMED)
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
  it(`should update status to ${EvmDepositStatus.DEPOSIT_TX_FAILED} if the transaction reverted`, async function () {
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
})
