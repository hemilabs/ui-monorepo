import { tokenList } from 'tokenList'
import { describe, expect, it, vi } from 'vitest'

const bridgedCbBtc = '0x1596bE338B999E2376675C908168A7548C8B0525'
const ethereumCbBtc = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'
const stargateCbBtc = '0x9778bC12904DB935Ca8be4fae26636BF7D6Da456'

// Listed first so the result can't depend on the list order
vi.mock('@hemilabs/token-list', async function (importOriginal) {
  const { default: list } = await importOriginal()
  return {
    default: {
      ...list,
      tokens: [
        {
          address: '0x9778bC12904DB935Ca8be4fae26636BF7D6Da456',
          chainId: 43111,
          decimals: 8,
          extensions: {
            allowanceSlot: 6,
            oft: {
              adapterAddress: '0x9778bC12904DB935Ca8be4fae26636BF7D6Da456',
              peers: {
                1: {
                  adapterAddress: '0x35CA6624E88898eB909A5B81195AE26A2aA9AA3a',
                  allowanceSlot: 10,
                  tokenAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
                },
              },
            },
          },
          logoURI: 'https://hemilabs.github.io/token-list/logos/cbbtc.svg',
          name: 'Coinbase Wrapped BTC',
          symbol: 'cbBTC',
        },
      ].concat(
        list.tokens.filter(
          t => t.address !== '0x9778bC12904DB935Ca8be4fae26636BF7D6Da456',
        ),
      ),
    },
  }
})

const findTokens = (chainId: number, address: string) =>
  tokenList.tokens.filter(t => t.chainId === chainId && t.address === address)

describe('tokenList with two Hemi tokens sharing a remote token', function () {
  it('should list both Hemi tokens', function () {
    expect(findTokens(43111, bridgedCbBtc)).toHaveLength(1)
    expect(findTokens(43111, stargateCbBtc)).toHaveLength(1)
  })

  it('should keep only the bridged copy of the remote token', function () {
    const remoteTokens = findTokens(1, ethereumCbBtc)
    expect(remoteTokens).toHaveLength(1)
    expect(remoteTokens[0].extensions?.bridgeInfo).toEqual({
      43111: { tokenAddress: bridgedCbBtc },
    })
  })

  it('should deliver the Stargate tunnel to the LayerZero peer', function () {
    expect(findTokens(1, ethereumCbBtc)[0].extensions).toMatchObject({
      tunnel: true,
      tunnelDstAddress: stargateCbBtc,
      tunnelPartners: ['stargate'],
    })
  })

  it('should not have duplicated tokens', function () {
    const keys = tokenList.tokens.map(t => `${t.chainId}-${t.address}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
