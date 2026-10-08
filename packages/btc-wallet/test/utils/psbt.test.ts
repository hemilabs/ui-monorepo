import * as bitcoin from 'bitcoinjs-lib'
import { describe, expect, it } from 'vitest'

import { getOutputScript } from '../../utils/psbt'

const { bitcoin: mainnet, testnet } = bitcoin.networks

// Addresses from the BIP173 and BIP350 test vectors
const p2trMainnet =
  'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0'
const p2trTestnet =
  'tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c'
const p2wpkh = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'

describe('getOutputScript', function () {
  it('builds a P2TR script on mainnet', function () {
    expect(getOutputScript(p2trMainnet, mainnet).toString('hex')).toBe(
      '512079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    )
  })

  it('builds a P2TR script on testnet', function () {
    expect(getOutputScript(p2trTestnet, testnet).toString('hex')).toBe(
      '5120000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433',
    )
  })

  it('builds a P2TR script from an uppercase address', function () {
    expect(
      getOutputScript(p2trMainnet.toUpperCase(), mainnet).toString('hex'),
    ).toBe(
      '512079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    )
  })

  it('throws for an address of another network', function () {
    expect(() => getOutputScript(p2trMainnet, testnet)).toThrow(
      /invalid prefix/,
    )
  })

  it('throws for a v1 address with a program that is not 32 bytes', function () {
    const address =
      'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kt5nd6y'
    expect(() => getOutputScript(address, mainnet)).toThrow(
      `Invalid taproot address ${address}`,
    )
  })

  it('builds a P2WPKH script', function () {
    expect(getOutputScript(p2wpkh, mainnet).toString('hex')).toBe(
      '0014751e76e8199196d454941c45d1b3a323f1433bd6',
    )
  })
})
