// Sentry event, span and breadcrumb fields are snake_case
/* eslint-disable camelcase */
import { scrubAddresses } from 'utils/scrubAddresses'
import { describe, expect, it } from 'vitest'

const checksummedAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
const lowercaseAddress = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359'
const txHash =
  '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'

const bech32Mainnet = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
const bech32Taproot =
  'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr'
const bech32Testnet = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'
const bech32Regtest = 'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080'
const p2pkhMainnet = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
const p2shMainnet = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
const p2pkhTestnetM = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn'
const p2pkhTestnetN = 'n2eMqTT929pb1RDNuqEnxdaLau1rxy3efi'
const p2shTestnet = '2N2JD6wb56AFK4JsCN5uMPo3TWLGdChJEHY'

// 32 hex chars, starts with "1" and has no "0", so it is valid base58
const traceId = '1a2b3c4d5e6f7a8b9c1d2e3f4a5b6c7d'

describe('utils/scrubAddresses', function () {
  describe('EVM addresses', function () {
    it('should replace a checksummed address in a portal API URL', function () {
      expect(scrubAddresses(`https://api/locks/${checksummedAddress}`)).toBe(
        'https://api/locks/<address>',
      )
    })

    it('should replace a lowercase address in a portal API URL', function () {
      expect(
        scrubAddresses(`https://api/earn-requests/${lowercaseAddress}`),
      ).toBe('https://api/earn-requests/<address>')
    })

    it('should replace the address in the subgraph deposits URL', function () {
      expect(
        scrubAddresses(`https://api/subgraphs/1/deposits/${lowercaseAddress}`),
      ).toBe('https://api/subgraphs/1/deposits/<address>')
    })

    it('should replace the address in the withdrawals URL', function () {
      expect(
        scrubAddresses(`https://api/withdrawals/${checksummedAddress}/evm`),
      ).toBe('https://api/withdrawals/<address>/evm')
    })

    it('should keep a tx hash unchanged', function () {
      expect(scrubAddresses(`tx ${txHash}`)).toBe(`tx ${txHash}`)
    })

    it('should replace several addresses in one string', function () {
      const message = `Transaction failed.\nfrom: ${checksummedAddress}\nto: ${lowercaseAddress}\nhash: ${txHash}`
      expect(scrubAddresses(message)).toBe(
        `Transaction failed.\nfrom: <address>\nto: <address>\nhash: ${txHash}`,
      )
    })

    it('should replace an address that follows a URL-encoded slash', function () {
      expect(scrubAddresses(`https://x/?path=%2F${lowercaseAddress}`)).toBe(
        'https://x/?path=%2F<address>',
      )
    })
  })

  describe('BTC addresses', function () {
    it('should replace a bech32 mainnet address in a mempool.space URL', function () {
      expect(
        scrubAddresses(
          `https://mempool.space/api/address/${bech32Mainnet}/txs`,
        ),
      ).toBe('https://mempool.space/api/address/<address>/txs')
    })

    it('should replace a taproot address', function () {
      expect(scrubAddresses(`address ${bech32Taproot}`)).toBe(
        'address <address>',
      )
    })

    it('should replace a bech32 testnet address', function () {
      expect(
        scrubAddresses(
          `https://mempool.space/testnet/api/address/${bech32Testnet}/utxo`,
        ),
      ).toBe('https://mempool.space/testnet/api/address/<address>/utxo')
    })

    it('should replace a bech32 regtest address', function () {
      expect(scrubAddresses(`address ${bech32Regtest}`)).toBe(
        'address <address>',
      )
    })

    it('should replace base58 P2PKH and P2SH mainnet addresses', function () {
      expect(scrubAddresses(`${p2pkhMainnet} and ${p2shMainnet}`)).toBe(
        '<address> and <address>',
      )
    })

    it('should replace base58 testnet addresses', function () {
      expect(
        scrubAddresses(`${p2pkhTestnetM}/${p2pkhTestnetN}/${p2shTestnet}`),
      ).toBe('<address>/<address>/<address>')
    })

    it('should replace a bech32 address that follows a URL-encoded slash', function () {
      expect(scrubAddresses(`https://x/?path=%2F${bech32Mainnet}`)).toBe(
        'https://x/?path=%2F<address>',
      )
    })

    it('should replace a base58 address that follows a URL-encoded slash', function () {
      expect(scrubAddresses(`https://x/?path=%2F${p2pkhMainnet}`)).toBe(
        'https://x/?path=%2F<address>',
      )
    })

    it('should replace BTC addresses that follow a lowercase URL-encoded char', function () {
      expect(
        scrubAddresses(`path=%2f${bech32Testnet}&to=%3a${p2shMainnet}`),
      ).toBe('path=%2f<address>&to=%3a<address>')
    })

    it('should keep the URL-encoded char before a 33 chars base58 address', function () {
      const shortP2pkh = '1BoatSLRHtKNngkdXEeobR76b53LETtpy'
      expect(scrubAddresses(`x=%2F${shortP2pkh}&y=%3A${shortP2pkh}`)).toBe(
        'x=%2F<address>&y=%3A<address>',
      )
    })

    it('should replace a base58 address right after a bare percent sign', function () {
      expect(scrubAddresses('50%1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(
        '50%<address>',
      )
    })

    it('should replace a P2SH address right after a bare percent sign', function () {
      expect(scrubAddresses(`50%${p2shMainnet}`)).toBe('50%<address>')
    })

    it('should replace a bech32 address right after a bare percent sign', function () {
      expect(
        scrubAddresses('fee 1%bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'),
      ).toBe('fee 1%<address>')
    })

    it('should keep BTC addresses glued to an alphanumeric char', function () {
      expect(scrubAddresses(`x${bech32Mainnet} x${p2pkhMainnet}`)).toBe(
        `x${bech32Mainnet} x${p2pkhMainnet}`,
      )
    })

    it('should keep BTC addresses after a hex pair with no percent sign', function () {
      expect(scrubAddresses(`2F${bech32Mainnet} 2F${p2pkhMainnet}`)).toBe(
        `2F${bech32Mainnet} 2F${p2pkhMainnet}`,
      )
    })

    it('should keep a 32 hex chars trace id that is valid base58', function () {
      expect(scrubAddresses(`sentry-trace ${traceId}-1`)).toBe(
        `sentry-trace ${traceId}-1`,
      )
    })
  })

  describe('non-string values', function () {
    it('should return numbers, booleans, null and undefined unchanged', function () {
      expect(scrubAddresses(42)).toBe(42)
      expect(scrubAddresses(true)).toBe(true)
      expect(scrubAddresses(false)).toBe(false)
      expect(scrubAddresses(null)).toBe(null)
      expect(scrubAddresses(undefined)).toBe(undefined)
    })

    it('should keep non-string primitives inside objects', function () {
      expect(
        scrubAddresses({
          count: 3,
          empty: null,
          enabled: false,
          missing: undefined,
        }),
      ).toEqual({ count: 3, empty: null, enabled: false, missing: undefined })
    })
  })

  describe('deep values', function () {
    it('should scrub a Sentry-like event', function () {
      const event = {
        breadcrumbs: [
          {
            category: 'fetch',
            data: {
              method: 'GET',
              status_code: 500,
              url: `https://api/earn-cost-basis/${lowercaseAddress}`,
            },
          },
          {
            category: 'console',
            message: `account ${bech32Testnet}`,
          },
        ],
        contexts: {
          response: {
            status_code: 500,
            url: `https://api/locks/${checksummedAddress}`,
          },
          trace: { trace_id: traceId },
        },
        event_id: 'c0ffee1234567890abcdef1234567890',
        exception: {
          values: [
            {
              type: 'Error',
              value: `The contract function reverted.\nsender: ${checksummedAddress}`,
            },
          ],
        },
        extra: {
          account: lowercaseAddress,
          addresses: [p2pkhMainnet, txHash],
        },
        message: `HTTP Client Error with status code: 500 for ${checksummedAddress}`,
        request: {
          url: `https://app.hemi.xyz/en/hemi-earn/vault/${checksummedAddress}`,
        },
        tags: { network: 'mainnet' },
      }

      expect(scrubAddresses(event)).toEqual({
        breadcrumbs: [
          {
            category: 'fetch',
            data: {
              method: 'GET',
              status_code: 500,
              url: 'https://api/earn-cost-basis/<address>',
            },
          },
          {
            category: 'console',
            message: 'account <address>',
          },
        ],
        contexts: {
          response: {
            status_code: 500,
            url: 'https://api/locks/<address>',
          },
          trace: { trace_id: traceId },
        },
        event_id: 'c0ffee1234567890abcdef1234567890',
        exception: {
          values: [
            {
              type: 'Error',
              value: 'The contract function reverted.\nsender: <address>',
            },
          ],
        },
        extra: {
          account: '<address>',
          addresses: ['<address>', txHash],
        },
        message: 'HTTP Client Error with status code: 500 for <address>',
        request: {
          url: 'https://app.hemi.xyz/en/hemi-earn/vault/<address>',
        },
        tags: { network: 'mainnet' },
      })
    })

    it('should scrub a span description and data', function () {
      const span = {
        data: {
          'http.url': `https://mempool.space/api/address/${bech32Testnet}/txs`,
          'url': `https://mempool.space/api/address/${bech32Testnet}/txs`,
        },
        description: `GET https://mempool.space/api/address/${bech32Testnet}/txs`,
        op: 'http.client',
        span_id: 'a1b2c3d4e5f6a7b8',
        trace_id: traceId,
      }

      expect(scrubAddresses(span)).toEqual({
        data: {
          'http.url': 'https://mempool.space/api/address/<address>/txs',
          'url': 'https://mempool.space/api/address/<address>/txs',
        },
        description: 'GET https://mempool.space/api/address/<address>/txs',
        op: 'http.client',
        span_id: 'a1b2c3d4e5f6a7b8',
        trace_id: traceId,
      })
    })

    it('should scrub object keys that are addresses', function () {
      expect(
        scrubAddresses({
          balances: { [bech32Mainnet]: 2 },
          [checksummedAddress]: { balance: '1' },
        }),
      ).toEqual({
        '<address>': { balance: '1' },
        'balances': { '<address>': 2 },
      })
    })

    it('should scrub an address key without losing a sibling value', function () {
      expect(
        scrubAddresses({ [checksummedAddress]: `owner ${lowercaseAddress}` }),
      ).toEqual({ '<address>': 'owner <address>' })
    })

    it('should keep every entry when several keys are addresses', function () {
      expect(
        scrubAddresses({ [checksummedAddress]: 1, [lowercaseAddress]: 2 }),
      ).toEqual({ '<address>': 1, '<address>#2': 2 })
    })

    it('should suffix colliding keys that only partially hold an address', function () {
      expect(
        scrubAddresses({
          [`balance_${checksummedAddress}`]: 1,
          [`balance_${lowercaseAddress}`]: 2,
          [`balance_${bech32Mainnet}`]: 3,
        }),
      ).toEqual({
        'balance_<address>': 1,
        'balance_<address>#2': 2,
        'balance_<address>#3': 3,
      })
    })

    it('should not overwrite an existing placeholder key', function () {
      expect(
        scrubAddresses(
          Object.fromEntries([
            [checksummedAddress, 1],
            ['<address>', 'x'],
          ]),
        ),
      ).toEqual({ '<address>': 'x', '<address>#2': 1 })
    })

    it('should scrub nested values under colliding address keys', function () {
      const result = scrubAddresses({
        [checksummedAddress]: { owner: lowercaseAddress },
        [lowercaseAddress]: [bech32Mainnet, { [p2pkhMainnet]: true }],
      })

      expect(result).toEqual({
        '<address>': { owner: '<address>' },
        '<address>#2': ['<address>', { '<address>': true }],
      })
      const serialized = JSON.stringify(result)
      ;[checksummedAddress, lowercaseAddress, bech32Mainnet, p2pkhMainnet]
        .map(address => address.toLowerCase())
        .forEach(address =>
          expect(serialized.toLowerCase()).not.toContain(address),
        )
    })

    it('should scrub top-level arrays', function () {
      expect(scrubAddresses([checksummedAddress, 'ok', 1])).toEqual([
        '<address>',
        'ok',
        1,
      ])
    })

    it('should leave stacktrace, debug_meta and sdkProcessingMetadata unchanged', function () {
      const stacktrace = {
        frames: [{ filename: `https://x/${checksummedAddress}.js` }],
      }
      const debugMeta = { images: [{ code_file: `/${lowercaseAddress}` }] }
      const sdkProcessingMetadata = { request: { url: `/${p2pkhMainnet}` } }

      const result = scrubAddresses({
        debug_meta: debugMeta,
        exception: {
          values: [{ stacktrace, value: `from ${checksummedAddress}` }],
        },
        sdkProcessingMetadata,
      })

      expect(result).toEqual({
        debug_meta: { images: [{ code_file: `/${lowercaseAddress}` }] },
        exception: {
          values: [
            {
              stacktrace: {
                frames: [{ filename: `https://x/${checksummedAddress}.js` }],
              },
              value: 'from <address>',
            },
          ],
        },
        sdkProcessingMetadata: { request: { url: `/${p2pkhMainnet}` } },
      })
    })

    it('should not mutate the input', function () {
      const input = {
        extra: { list: [lowercaseAddress] },
        message: `from ${checksummedAddress}`,
      }

      const result = scrubAddresses(input)

      expect(result).not.toBe(input)
      expect(result.extra).not.toBe(input.extra)
      expect(result.extra.list).not.toBe(input.extra.list)
      expect(input).toEqual({
        extra: { list: [lowercaseAddress] },
        message: `from ${checksummedAddress}`,
      })
    })

    it('should handle a cyclic plain object without throwing', function () {
      const input: Record<string, unknown> = {
        url: `/locks/${lowercaseAddress}`,
      }
      input.self = input
      const list: unknown[] = [checksummedAddress]
      list.push(list)
      input.list = list

      const result = scrubAddresses(input) as Record<string, unknown>

      expect(result.url).toBe('/locks/<address>')
      expect(result.self).toBe(result)
      const resultList = result.list as unknown[]
      expect(resultList[0]).toBe('<address>')
      expect(resultList[1]).toBe(resultList)
    })
  })
})
