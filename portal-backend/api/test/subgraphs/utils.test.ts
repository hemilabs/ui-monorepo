import { describe, expect, it } from 'vitest'

import { isChainId, isInteger } from '../../src/subgraphs/utils.ts'

describe('isChainId', function () {
  it.each(['1', '11155111', '43111', '743111'])(
    'accepts the valid chain id %j',
    function (chainId) {
      expect(isChainId(chainId)).toBe(true)
    },
  )

  it.each(['0', '00', '01', '043111', '0043111'])(
    'rejects the zero-padded or zero chain id %j',
    function (chainId) {
      expect(isChainId(chainId)).toBe(false)
    },
  )

  it.each(['', '-1', '1.5', '0x1', 'abc', '43111abc', ' 43111'])(
    'rejects the non-integer chain id %j',
    function (chainId) {
      expect(isChainId(chainId)).toBe(false)
    },
  )
})

describe('isInteger', function () {
  it.each(['0', '10'])(
    'accepts %j so query params like skip=0 stay valid',
    function (value) {
      expect(isInteger(value)).toBe(true)
    },
  )
})
