import { getRemoteTokens } from 'tokenList'
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
  name: 'Dai Stablecoin',
  symbol: 'DAI',
}

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
})
