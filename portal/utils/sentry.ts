import type { ErrorEvent, EventHint } from '@sentry/react'

// EIP-1193 codes: 4001 is a user rejection, 4900 a disconnected provider
const walletProviderErrorCodes = [4001, 4900]

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

// WalletConnect logs records like { context: 'core/relayer/subscription',
// level: 50 } to the console, so they reach Sentry as "[object Object]"
// messages.
const isWalletConnectLogRecord = (value: unknown) =>
  isObject(value) &&
  typeof value.context === 'string' &&
  typeof value.level === 'number'

const isReownConfigLog = (value: unknown) =>
  typeof value === 'string' && value.startsWith('[Reown Config]')

const hasWalletProviderErrorCode = (exception: unknown) =>
  isObject(exception) &&
  typeof exception.code === 'number' &&
  walletProviderErrorCodes.includes(exception.code)

export const isWalletNoise = function (event: ErrorEvent, hint: EventHint) {
  const args = event.extra?.arguments
  return (
    (Array.isArray(args) &&
      (isReownConfigLog(args[0]) || args.some(isWalletConnectLogRecord))) ||
    hasWalletProviderErrorCode(hint.originalException)
  )
}
