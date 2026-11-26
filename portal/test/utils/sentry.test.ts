import { isWalletNoise } from 'utils/sentry'
import { describe, expect, it } from 'vitest'

const consoleEvent = (...args: unknown[]) => ({
  extra: { arguments: args },
  message: '[object Object]',
})

describe('utils/sentry', function () {
  describe('isWalletNoise', function () {
    it('should drop WalletConnect logger records', function () {
      const record = { context: 'core/relayer/subscription', level: 50 }
      expect(isWalletNoise(consoleEvent(record), {})).toBe(true)
    })

    it('should drop a WalletConnect record among other arguments', function () {
      const record = { context: 'core/relayer', level: 40 }
      expect(isWalletNoise(consoleEvent('message', record), {})).toBe(true)
    })

    it('should drop Reown configuration logs', function () {
      expect(
        isWalletNoise(
          consoleEvent(
            '[Reown Config] Failed to fetch remote project configuration.',
            Object.assign(new Error('Failed to fetch'), { name: 'TypeError' }),
          ),
          {},
        ),
      ).toBe(true)
    })

    it('should keep console events without Reown configuration prefixes', function () {
      expect(
        isWalletNoise(
          consoleEvent('Failed to fetch remote project configuration'),
          {},
        ),
      ).toBe(false)
    })

    it('should keep objects with a context but no numeric level', function () {
      expect(isWalletNoise(consoleEvent({ context: 'portal' }), {})).toBe(false)
      expect(
        isWalletNoise(consoleEvent({ context: 'portal', level: 'error' }), {}),
      ).toBe(false)
    })

    it('should keep objects with a non string context', function () {
      expect(isWalletNoise(consoleEvent({ context: 1, level: 50 }), {})).toBe(
        false,
      )
    })

    it('should keep console events with only primitive arguments', function () {
      expect(isWalletNoise(consoleEvent('error', null, 1), {})).toBe(false)
    })

    it('should drop provider disconnected rejections', function () {
      expect(
        isWalletNoise(
          {},
          { originalException: { code: 4900, message: 'disconnected' } },
        ),
      ).toBe(true)
    })

    it('should drop user rejections', function () {
      expect(
        isWalletNoise({}, { originalException: { code: 4001, message: '' } }),
      ).toBe(true)
    })

    it('should drop errors carrying a wallet provider code', function () {
      const error = Object.assign(new Error('User rejected'), { code: 4001 })
      expect(isWalletNoise({}, { originalException: error })).toBe(true)
    })

    it('should keep other provider error codes', function () {
      expect(isWalletNoise({}, { originalException: { code: -32603 } })).toBe(
        false,
      )
    })

    it('should keep codes passed as strings', function () {
      expect(isWalletNoise({}, { originalException: { code: '4900' } })).toBe(
        false,
      )
    })

    it('should keep events without an original exception or arguments', function () {
      expect(isWalletNoise({ message: 'Something failed' }, {})).toBe(false)
      expect(
        isWalletNoise({}, { originalException: new Error('Something failed') }),
      ).toBe(false)
    })
  })
})
