import { bitcoinTestnet } from 'btc-wallet/chains'
import { hemi, hemiSepolia } from 'hemi-viem'
import {
  getL1StandardBridgeAddress,
  getL2BridgeAddress,
  isBtcNetworkId,
  isL2Network,
  isEvmNetwork,
} from 'utils/chain'
import { mainnet, sepolia } from 'viem/chains'
import { describe, expect, it } from 'vitest'

describe('utils/chain', function () {
  describe('isBtcNetworkId', function () {
    it('should return true if the chain is a bitcoin chain', function () {
      expect(isBtcNetworkId(bitcoinTestnet.id)).toBe(true)
    })

    it('should return false if the chain is not a bitcoin one', function () {
      expect(isBtcNetworkId(sepolia.id)).toBe(false)
    })
  })
  describe('isEvmNetwork()', function () {
    it('should return false if the chain is not evm compatible', function () {
      expect(isEvmNetwork(bitcoinTestnet)).toBe(false)
    })

    it('should return true if the chain is evm compatible', function () {
      expect(isEvmNetwork(sepolia)).toBe(true)
    })
  })
  describe('isL2Network()', function () {
    it('should return false if the chain is an L1', function () {
      expect(isL2Network(sepolia)).toBe(false)
    })

    it('should return true if the chain is hemi', function () {
      expect(isL2Network(hemiSepolia)).toBe(true)
    })
  })
  describe('getL1StandardBridgeAddress()', function () {
    it('should resolve the address of the hemi tunneling the given L1', function () {
      expect(getL1StandardBridgeAddress(mainnet.id)).toBe(
        hemi.contracts.l1StandardBridge[mainnet.id].address,
      )
      expect(getL1StandardBridgeAddress(sepolia.id)).toBe(
        hemiSepolia.contracts.l1StandardBridge[sepolia.id].address,
      )
    })
  })
  describe('getL2BridgeAddress()', function () {
    it('should resolve the address of the hemi tunneling the given L1', function () {
      expect(getL2BridgeAddress(mainnet.id)).toBe(
        hemi.contracts.l2Bridge[mainnet.id].address,
      )
      expect(getL2BridgeAddress(sepolia.id)).toBe(
        hemiSepolia.contracts.l2Bridge[sepolia.id].address,
      )
    })
  })
})
