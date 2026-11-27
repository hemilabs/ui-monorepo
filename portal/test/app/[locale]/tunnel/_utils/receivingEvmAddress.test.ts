import { resolveReceivingEvmAddress } from 'app/[locale]/tunnel/_utils/receivingEvmAddress'
import { zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

const customAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
const walletAddress = '0x1111111111111111111111111111111111111111'

describe('resolveReceivingEvmAddress', function () {
  it('uses the wallet address when the custom address is off', function () {
    expect(
      resolveReceivingEvmAddress({
        customAddress,
        customAddressEnabled: false,
        walletAddress,
      }),
    ).toEqual({
      errorKey: undefined,
      isCustomAddressValid: true,
      receivingAddress: walletAddress,
    })
  })

  it('has no receiving address when the wallet is not connected', function () {
    expect(
      resolveReceivingEvmAddress({
        customAddress: '',
        customAddressEnabled: false,
        walletAddress: undefined,
      }),
    ).toEqual({
      errorKey: undefined,
      isCustomAddressValid: false,
      receivingAddress: undefined,
    })
  })

  it('asks for an address when the custom address is empty', function () {
    expect(
      resolveReceivingEvmAddress({
        customAddress: '',
        customAddressEnabled: true,
        walletAddress,
      }),
    ).toEqual({
      errorKey: 'enter-a-custom-address',
      isCustomAddressValid: false,
      receivingAddress: undefined,
    })
  })

  it('rejects a custom address that is not an address', function () {
    expect(
      resolveReceivingEvmAddress({
        customAddress: customAddress.slice(0, -1),
        customAddressEnabled: true,
        walletAddress,
      }),
    ).toEqual({
      errorKey: 'input-a-correct-custom-address',
      isCustomAddressValid: false,
      receivingAddress: undefined,
    })
  })

  it.each([
    ['all lowercase', customAddress.toLowerCase()],
    ['all uppercase', `0x${customAddress.slice(2).toUpperCase()}`],
  ])(
    'accepts a custom address in %s and returns it checksummed',
    function (_, address) {
      expect(
        resolveReceivingEvmAddress({
          customAddress: address,
          customAddressEnabled: true,
          walletAddress,
        }),
      ).toEqual({
        errorKey: undefined,
        isCustomAddressValid: true,
        receivingAddress: customAddress,
      })
    },
  )

  it.each([
    ['a wrong checksum', customAddress.replace('aA', 'aa')],
    [
      'a typo in a checksummed address',
      customAddress.replace('BeAed', 'BeAee'),
    ],
  ])('rejects a custom address with %s', function (_, address) {
    expect(
      resolveReceivingEvmAddress({
        customAddress: address,
        customAddressEnabled: true,
        walletAddress,
      }),
    ).toEqual({
      errorKey: 'input-a-correct-custom-address',
      isCustomAddressValid: false,
      receivingAddress: undefined,
    })
  })

  it('uses a valid custom address', function () {
    expect(
      resolveReceivingEvmAddress({
        customAddress,
        customAddressEnabled: true,
        walletAddress,
      }),
    ).toEqual({
      errorKey: undefined,
      isCustomAddressValid: true,
      receivingAddress: customAddress,
    })
  })

  it('rejects the zero address as a custom address', function () {
    expect(
      resolveReceivingEvmAddress({
        customAddress: zeroAddress,
        customAddressEnabled: true,
        walletAddress,
      }),
    ).toEqual({
      errorKey: 'input-a-correct-custom-address',
      isCustomAddressValid: false,
      receivingAddress: undefined,
    })
  })
})
