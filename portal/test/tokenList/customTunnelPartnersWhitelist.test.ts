import { customTunnelPartnersWhitelist } from 'tokenList/customTunnelPartnersWhitelist'
import { describe, expect, it } from 'vitest'

describe('tokenList/customTunnelPartnersWhitelist', function () {
  it('should key the Ethereum entries by the bridged pair of each Hemi token', function () {
    expect(customTunnelPartnersWhitelist[1]).toEqual({
      // USDC
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
        tunnelPartners: ['jumper', 'stargate'],
        tunnelSymbol: 'USDC',
      },
      // cbBTC
      '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': {
        tunnelDstAddress: '0x9778bC12904DB935Ca8be4fae26636BF7D6Da456',
        tunnelPartners: ['stargate'],
      },
      // USDT
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
        tunnelPartners: ['stargate'],
      },
    })
  })

  it('should key the Hemi entries by the Hemi token', function () {
    expect(customTunnelPartnersWhitelist[43111]).toEqual({
      // USDC
      '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA': {
        tunnelPartners: ['jumper', 'stargate'],
        tunnelSymbol: 'USDC',
      },
      // USDT
      '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e': {
        tunnelPartners: ['stargate'],
        tunnelSymbol: 'USDT',
      },
    })
  })
})
