import {
  calculateDepositAmount,
  getBitcoinTimestamp,
  isAddressOfBitcoinNetwork,
} from 'utils/bitcoin'
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

  describe('isAddressOfBitcoinNetwork', function () {
    it('should accept the addresses of the given network', function () {
      const addresses = {
        livenet: [
          '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4',
          'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
        ],
        testnet: [
          'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
          'n2eMqTT929pb1RDNuqEnxdaLau1rxy3efi',
          '2N2JD6wb56AFK4JsCN5uMPo3TWLGdChJEHY',
          'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        ],
      }
      Object.entries(addresses).forEach(([network, list]) =>
        list.forEach(address =>
          expect(isAddressOfBitcoinNetwork(address, network)).toBe(true),
        ),
      )
    })

    it('should reject the addresses of another network', function () {
      expect(
        isAddressOfBitcoinNetwork(
          'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          'livenet',
        ),
      ).toBe(false)
      expect(
        isAddressOfBitcoinNetwork(
          'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
          'livenet',
        ),
      ).toBe(false)
      expect(
        isAddressOfBitcoinNetwork(
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          'testnet',
        ),
      ).toBe(false)
      expect(
        isAddressOfBitcoinNetwork(
          '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          'testnet',
        ),
      ).toBe(false)
    })

    it('should reject a regtest address on both networks', function () {
      const address = 'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080'
      expect(isAddressOfBitcoinNetwork(address, 'livenet')).toBe(false)
      expect(isAddressOfBitcoinNetwork(address, 'testnet')).toBe(false)
    })
  })
})
