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
    ).toMatchObject({ name: 'USDC', symbol: 'USDC.e' })
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

  it('should include vetBTC on Ethereum', function () {
    expect(
      findToken(1, '0xf196C68233464A16CFDa319a47c21f4cECa62001'),
    ).toMatchObject({ decimals: 18, symbol: 'vetBTC' })
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
