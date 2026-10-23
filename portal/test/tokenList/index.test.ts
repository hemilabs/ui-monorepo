import { getRemoteTokens, tokenList } from 'tokenList'
import { describe, expect, it } from 'vitest'

const token = {
  address: '0x6c851F501a3F24E29A8E39a29591cddf09369080',
  chainId: 43111,
  decimals: 18,
  extensions: {
    bridgeInfo: {
      1: {
        allowanceSlot: 3,
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      },
    },
  },
  logoURI: 'https://hemilabs.github.io/token-list/logos/dai.svg',
  name: 'Dai Stablecoin',
  symbol: 'DAI',
}

const oftToken = {
  address: '0xfF16E26B7fFCf24c378D57DF536dC5eC104a7dE4',
  chainId: 43111,
  decimals: 18,
  extensions: {
    oft: {
      adapterAddress: '0xfF16E26B7fFCf24c378D57DF536dC5eC104a7dE4',
      peers: {
        1: {
          allowanceSlot: 1,
          tokenAddress: '0xf196C68233464A16CFDa319a47c21f4cECa62001',
        },
        10: { tokenAddress: '0xB5259c05764468c33C9c36e327cAAD020a8E5Fe1' },
      },
    },
  },
  name: 'Vetro BTC',
  symbol: 'vetBTC',
}

const findToken = (chainId: number, address: string) =>
  tokenList.tokens.find(t => t.chainId === chainId && t.address === address)

describe('getRemoteTokens', function () {
  it('should carry the allowance slot of the bridged token', function () {
    const [remoteToken] = getRemoteTokens(token)
    expect(remoteToken.address).toBe(
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    )
    expect(remoteToken.extensions?.allowanceSlot).toBe(3)
  })

  it('should leave the allowance slot unset when the bridged token has none', function () {
    const [remoteToken] = getRemoteTokens({
      ...token,
      extensions: {
        bridgeInfo: {
          1: { tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
        },
      },
    })
    expect(remoteToken.extensions?.allowanceSlot).toBeUndefined()
  })

  it('should use the L1 logo of the token', function () {
    const [remoteToken] = getRemoteTokens(token)
    expect(remoteToken.logoURI).toBe(
      'https://hemilabs.github.io/token-list/l1Logos/dai.svg',
    )
  })

  it('should not create remote tokens for Bitcoin pairs', function () {
    const remoteTokens = getRemoteTokens({
      ...token,
      extensions: { bridgeInfo: { livenet: { tokenAddress: 'BTC' } } },
    })
    expect(remoteTokens).toEqual([])
  })

  it('should create the remote token of an OFT peer on the source chain', function () {
    const remoteTokens = getRemoteTokens(oftToken)
    expect(remoteTokens).toHaveLength(1)
    expect(remoteTokens[0]).toMatchObject({
      address: '0xf196C68233464A16CFDa319a47c21f4cECa62001',
      chainId: 1,
      extensions: { allowanceSlot: 1 },
      symbol: 'vetBTC',
    })
    expect(remoteTokens[0].extensions?.bridgeInfo).toBeUndefined()
  })

  it('should point the remote token of an OFT peer back to the Hemi token', function () {
    const [remoteToken] = getRemoteTokens(oftToken)
    expect(remoteToken.extensions?.oft?.peers).toEqual({
      43111: { tokenAddress: '0xfF16E26B7fFCf24c378D57DF536dC5eC104a7dE4' },
    })
  })

  it('should prefer the bridged token over an OFT peer on the same chain', function () {
    const remoteTokens = getRemoteTokens({
      ...token,
      extensions: { ...token.extensions, oft: oftToken.extensions.oft },
    })
    expect(remoteTokens).toHaveLength(1)
    expect(remoteTokens[0].address).toBe(
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    )
  })
})

describe('tokenList', function () {
  it('should apply the display overrides to the Hemi tokens and their remote tokens', function () {
    expect(
      findToken(43111, '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA'),
    ).toMatchObject({ name: 'USDC (Stargate)', symbol: 'USDC.e' })
    expect(
      findToken(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
    ).toMatchObject({ name: 'USDC', symbol: 'USDC' })
    expect(
      findToken(743111, '0xec46E0EFB2EA8152da0327a5Eb3FF9a43956F13e'),
    ).toMatchObject({ name: 'Dai Stablecoin', symbol: 'DAI' })
    expect(
      findToken(11155111, '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357'),
    ).toMatchObject({ name: 'Dai Stablecoin', symbol: 'DAI' })
  })

  it.each([
    [
      'cbBTC',
      '0x1596bE338B999E2376675C908168A7548C8B0525',
      'Coinbase Wrapped BTC',
    ],
    [
      'cbBTC',
      '0x9778bC12904DB935Ca8be4fae26636BF7D6Da456',
      'Coinbase Wrapped BTC (Stargate)',
    ],
    ['USDT', '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e', 'USDT (Stargate)'],
  ])('should name %s at %s on Hemi as %s', function (symbol, address, name) {
    expect(findToken(43111, address)).toMatchObject({ name, symbol })
  })

  it.each([
    [
      'cbBTC',
      '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      'Coinbase Wrapped BTC',
    ],
    ['USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT'],
  ])(
    'should keep the %s name on Ethereum without the bridge suffix',
    function (symbol, address, name) {
      expect(findToken(1, address)).toMatchObject({ name, symbol })
    },
  )

  it('should include vetBTC on Ethereum', function () {
    expect(
      findToken(1, '0xf196C68233464A16CFDa319a47c21f4cECa62001'),
    ).toMatchObject({ decimals: 18, symbol: 'vetBTC' })
  })

  it.each([
    ['sVUSD', 43111, '0xfe875CC86cC6BC2E93ab330D6b2c408C3Cd79710'],
    ['sVUSD', 1, '0x476310E34D2810f7d79C43A74E4D79405bd7a925'],
    ['svetBTC', 43111, '0xD8D63De3b64bd06d99F8F5AD8B78Ed2fE7525eC0'],
    ['svetBTC', 1, '0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e'],
    ['vetBTC', 43111, '0xfF16E26B7fFCf24c378D57DF536dC5eC104a7dE4'],
    ['vetBTC', 1, '0xf196C68233464A16CFDa319a47c21f4cECa62001'],
    ['VUSD', 43111, '0xD3599AE62EE280709A22268a46d23164214e345B'],
    ['VUSD', 1, '0xCa83DDE9c22254f58e771bE5E157773212AcBAc3'],
  ])(
    'should tunnel %s on chain %i through Stargate',
    function (symbol, chainId, address) {
      expect(findToken(chainId, address)).toMatchObject({
        extensions: { tunnel: true, tunnelPartners: ['stargate'] },
        symbol,
      })
    },
  )

  it('should not tunnel hemiBTC on Ethereum', function () {
    expect(
      findToken(1, '0x06ea695B91700071B161A434fED42D1DcbAD9f00')?.extensions
        ?.tunnel,
    ).toBeUndefined()
  })

  it('should not have duplicated tokens', function () {
    const keys = tokenList.tokens.map(t => `${t.chainId}-${t.address}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('should not have tokens with an invalid chain', function () {
    expect(
      tokenList.tokens.filter(
        t => typeof t.chainId === 'number' && !Number.isInteger(t.chainId),
      ),
    ).toEqual([])
  })
})
