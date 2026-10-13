import { nativeTokens } from 'tokenList/nativeTokens'
import { describe, expect, it } from 'vitest'

const findNativeToken = (chainId: number | string) =>
  nativeTokens.find(t => t.chainId === chainId)

describe('tokenList/nativeTokens', function () {
  it('should pair Bitcoin with the Hemi token it is tunneled to', function () {
    expect(findNativeToken('livenet')?.extensions?.bridgeInfo).toEqual({
      43111: { tokenAddress: '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28' },
    })
    expect(findNativeToken('testnet')?.extensions?.bridgeInfo).toEqual({
      743111: { tokenAddress: '0x36Ab5Dba83d5d470F670BC4c06d7Da685d9afAe7' },
    })
  })

  it('should use the L1 logo for ETH on Ethereum', function () {
    expect(findNativeToken(1)?.logoURI).toBe(
      'https://hemilabs.github.io/token-list/l1Logos/eth.svg',
    )
  })
})
