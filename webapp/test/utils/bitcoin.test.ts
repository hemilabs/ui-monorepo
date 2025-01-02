import { calculateDepositAmount, getBitcoinTimestamp } from 'utils/bitcoin'
import { describe, expect, it, vi } from 'vitest'

describe('utils/bitcoin', function () {
  describe('calculateDepositAmount', function () {
    it('calculate the deposit amount of a bitcoin deposit transaction', function () {
      const userAddress = 'tb1qmynr0k2fuvc24rg2j0xq2wztjvwuqnkdjxvky6'
      const bitcoinCustodyAddress = 'tb1qvs632vkezddhuahgdqmwjapm4raprsx0nvyq2q'

      const utxos = [
        // amount sent to the custody address
        { scriptpubkeyAddress: bitcoinCustodyAddress, value: 10000 },
        // OP_RETURN
        { value: 0 },
        // change
        { scriptpubkeyAddress: userAddress, value: 300000 },
      ]

      expect(calculateDepositAmount(utxos, bitcoinCustodyAddress)).toBe(10000)
    })
  })

  describe('getBitcoinTimestamp', function () {
    it('should return the block time if is prior to the current time', function () {
      // using 5 minutes ago
      const blockTime = Math.floor((new Date().getTime() - 5 * 1000) / 1000)

      expect(getBitcoinTimestamp(blockTime)).toBe(blockTime)
    })

    it('should return the current time if the block time is in the future', function () {
      const now = new Date(2024, 11, 19).getTime()
      // using 5 minutes from now
      const blockTime = Math.floor((now + 5 * 1000) / 1000)
      vi.setSystemTime(now)

      expect(getBitcoinTimestamp(blockTime)).toBe(Math.floor(now / 1000))
    })
  })
})
