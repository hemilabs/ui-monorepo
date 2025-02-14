import { hemi, hemiSepolia } from 'hemi-viem'
import { HemiPublicClient, HemiWalletClient } from 'hooks/useHemiClient'
import { EvmToken } from 'types/token'
import { canSubmit, stake } from 'utils/stake'
import { getErc20TokenBalance } from 'utils/token'
import { parseUnits, zeroAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('utils/nativeToken', () => ({
  isNativeToken: vi.fn(token => token.symbol === 'ETH'),
}))

vi.mock('utils/token', () => ({
  getErc20TokenBalance: vi.fn(),
}))

// @ts-expect-error Adding minimal properties needed
const token: EvmToken = {
  address: zeroAddress,
  chainId: hemiSepolia.id,
  decimals: 18,
  symbol: 'fakeToken',
}

describe('utils/stake', function () {
  describe('canSubmit', function () {
    it('should return error if amount is a negative value', function () {
      const result = canSubmit({
        amount: BigInt(-123),
        balance: BigInt(1000),
        connectedChainId: hemiSepolia.id,
        token,
      })
      expect(result).toEqual({ error: 'amount-less-equal-than-0' })
    })

    it('should return error if amount is equal to 0', function () {
      const result = canSubmit({
        amount: BigInt(0),
        balance: BigInt(1000),
        connectedChainId: hemiSepolia.id,
        token,
      })
      expect(result).toEqual({ error: 'amount-less-equal-than-0' })
    })

    it('should return error if chain ID does not match', function () {
      const result = canSubmit({
        amount: BigInt(1),
        balance: BigInt(1000),
        connectedChainId: hemi.id,
        token,
      })
      expect(result).toEqual({ error: 'wrong-chain' })
    })

    it('should return error if balance is less than or equal to 0', function () {
      const result = canSubmit({
        amount: BigInt(1),
        balance: BigInt(0),
        connectedChainId: hemiSepolia.id,
        token,
      })
      expect(result).toEqual({ error: 'not-enough-balance' })
    })

    it('should return error if balance is less than the amount', function () {
      const result = canSubmit({
        amount: BigInt(10),
        balance: BigInt(9),
        connectedChainId: hemiSepolia.id,
        token,
      })
      expect(result).toEqual({ error: 'amount-larger-than-balance' })
    })

    it('should return empty object if all conditions are met', function () {
      const result = canSubmit({
        amount: BigInt(1),
        balance: BigInt(1000),
        connectedChainId: hemiSepolia.id,
        token,
      })
      expect(result).toEqual({})
    })
  })

  describe('stake', function () {
    beforeEach(function () {
      vi.clearAllMocks()
    })

    // @ts-expect-error only add the minimum values required
    const hemiPublicClient: HemiPublicClient = { chain: hemiSepolia }
    // @ts-expect-error only add the minimum values required
    const hemiWalletClient: HemiWalletClient = {
      stakeERC20Token: vi.fn(),
      stakeETHToken: vi.fn(),
    }

    it('should throw error if the consumer can not stake', async function () {
      getErc20TokenBalance.mockResolvedValue(BigInt(0))
      await expect(
        stake({
          amount: '1',
          forAccount: zeroAddress,
          hemiPublicClient,
          hemiWalletClient,
          token,
        }),
      ).rejects.toThrow('not-enough-balance')
    })

    it('should call stakeToken if all conditions are met', async function () {
      getErc20TokenBalance.mockResolvedValue(parseUnits('10', token.decimals))
      await stake({
        amount: '1',
        forAccount: zeroAddress,
        hemiPublicClient,
        hemiWalletClient,
        token,
      })
      expect(hemiWalletClient.stakeERC20Token).toHaveBeenCalledWith({
        amount: parseUnits('1', token.decimals),
        forAccount: zeroAddress,
        tokenAddress: token.address,
      })
    })
  })
})
