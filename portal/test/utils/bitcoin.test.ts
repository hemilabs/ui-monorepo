import {
  calculateDepositAmount,
  getBitcoinTimestamp,
  isValidBtcAddress,
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
  describe('isValidBtcAddress', function () {
    it('should accept every mainnet address type', function () {
      const addresses = [
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // P2PKH
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // P2WPKH
        'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3', // P2WSH
        'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr', // P2TR
      ]
      addresses.forEach(address =>
        expect(isValidBtcAddress(address, 'livenet')).toBe(true),
      )
    })

    it('should accept every testnet address type', function () {
      const addresses = [
        'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn', // P2PKH
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', // P2WPKH
        'tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c', // P2TR
      ]
      addresses.forEach(address =>
        expect(isValidBtcAddress(address, 'testnet')).toBe(true),
      )
    })

    it('should reject an address that belongs to the other network', function () {
      expect(
        isValidBtcAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'testnet'),
      ).toBe(false)
      expect(
        isValidBtcAddress(
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          'testnet',
        ),
      ).toBe(false)
      expect(
        isValidBtcAddress(
          'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
          'testnet',
        ),
      ).toBe(false)
      expect(
        isValidBtcAddress('mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn', 'livenet'),
      ).toBe(false)
      expect(
        isValidBtcAddress(
          'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          'livenet',
        ),
      ).toBe(false)
    })

    it('should reject an address with a wrong checksum', function () {
      expect(
        isValidBtcAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN3', 'livenet'),
      ).toBe(false)
      expect(
        isValidBtcAddress(
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5',
          'livenet',
        ),
      ).toBe(false)
      expect(
        isValidBtcAddress(
          'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcx',
          'livenet',
        ),
      ).toBe(false)
    })

    it('should reject a taproot address that is not a curve point', function () {
      // valid bech32m, but its witness program is x = 0, which is not on the curve
      expect(
        isValidBtcAddress(
          'bc1pqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqqenm',
          'livenet',
        ),
      ).toBe(false)
    })

    it('should reject a witness version Bitcoin does not define', function () {
      // bech32 encodes versions up to 31, but Bitcoin only defines 0 to 16
      expect(
        isValidBtcAddress(
          'bc13qyqszqgpqyqszqgpqyqszqgpqyqszqgpw8fxwv',
          'livenet',
        ),
      ).toBe(false)
      expect(
        isValidBtcAddress(
          'bc1lqyqszqgpqyqszqgpqyqszqgpqyqszqgphhul64',
          'livenet',
        ),
      ).toBe(false)
      // v16 is the last defined one, and is still accepted
      expect(
        isValidBtcAddress(
          'bc1sqyqszqgpqyqszqgpqyqszqgpqyqszqgp9e7dr8',
          'livenet',
        ),
      ).toBe(true)
    })

    it('should reject a witness v0 address of an invalid length', function () {
      expect(
        isValidBtcAddress(
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx',
          'livenet',
        ),
      ).toBe(false)
    })

    it('should reject strings that are not addresses', function () {
      const values = [
        '',
        '   ',
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        '12w8F8XVTxJMHgtvFTQ8G8WewExiMCTABE',
      ]
      values.forEach(value =>
        expect(isValidBtcAddress(value, 'livenet')).toBe(false),
      )
    })
  })
})
