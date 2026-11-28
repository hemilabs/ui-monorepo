import { getL1BridgePair } from 'app/[locale]/get-started/_utils/getL1BridgePair'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { describe, expect, it } from 'vitest'

const remoteNetworks = [
  { id: 'livenet', name: 'Bitcoin' },
  { id: 1, name: 'Ethereum' },
]

const token = {
  address: '0xfF16E26B7fFCf24c378D57DF536dC5eC104a7dE4',
  chainId: 43111,
  decimals: 18,
  name: 'Vetro BTC',
  symbol: 'vetBTC',
}

describe('app/[locale]/get-started/_utils/getL1BridgePair', function () {
  it('should return the bridged pair', function () {
    expect(
      getL1BridgePair(
        {
          ...token,
          extensions: {
            bridgeInfo: {
              1: { tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
            },
          },
        },
        remoteNetworks,
      ),
    ).toEqual({
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      networkName: 'Ethereum',
    })
  })

  it('should return the native token when bridged from native ETH', function () {
    expect(
      getL1BridgePair(
        {
          ...token,
          extensions: {
            bridgeInfo: { 1: { tokenAddress: NativeTokenSpecialAddressOnL2 } },
          },
        },
        remoteNetworks,
      ),
    ).toEqual({ address: 'ETH', networkName: 'Ethereum' })
  })

  it('should prefer the bridged pair over the OFT peers', function () {
    expect(
      getL1BridgePair(
        {
          ...token,
          extensions: {
            bridgeInfo: { livenet: { tokenAddress: 'BTC' } },
            oft: {
              peers: {
                1: {
                  tokenAddress: '0x06ea695B91700071B161A434fED42D1DcbAD9f00',
                },
              },
            },
          },
        },
        remoteNetworks,
      ),
    ).toEqual({ address: 'BTC', networkName: 'Bitcoin' })
  })

  it('should return the OFT peer on a supported network', function () {
    expect(
      getL1BridgePair(
        {
          ...token,
          extensions: {
            oft: {
              peers: {
                1: {
                  tokenAddress: '0xf196C68233464A16CFDa319a47c21f4cECa62001',
                },
                10: {
                  tokenAddress: '0xB5259c05764468c33C9c36e327cAAD020a8E5Fe1',
                },
              },
            },
          },
        },
        remoteNetworks,
      ),
    ).toEqual({
      address: '0xf196C68233464A16CFDa319a47c21f4cECa62001',
      networkName: 'Ethereum',
    })
  })

  it('should return null when no pair is on a supported network', function () {
    expect(
      getL1BridgePair(
        {
          ...token,
          extensions: {
            oft: {
              peers: {
                10: {
                  tokenAddress: '0xB5259c05764468c33C9c36e327cAAD020a8E5Fe1',
                },
              },
            },
          },
        },
        remoteNetworks,
      ),
    ).toBeNull()
  })

  it('should return null when the token has no pairs', function () {
    expect(getL1BridgePair(token, remoteNetworks)).toBeNull()
  })
})
