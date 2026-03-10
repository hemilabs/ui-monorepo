import type { ConsoleLevel } from '@sentry/core'
import * as Sentry from '@sentry/node'
import config from 'config'

const dsn = config.get<string>('sentry.dsn')
const loggingLevels = config.get<ConsoleLevel[]>('sentry.loggingLevels')

if (dsn) {
  Sentry.init({
    dsn,
    enableLogs: true,
    environment: process.env.NODE_ENV || 'development',
    integrations: [Sentry.consoleLoggingIntegration({ levels: loggingLevels })],
    sendDefaultPii: true,
  })
}
