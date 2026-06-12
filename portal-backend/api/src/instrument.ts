import type { ConsoleLevel } from '@sentry/core'
import { consoleLoggingIntegration, init } from '@sentry/node'
import config from 'config'

const { dsn, loggingLevels } = config.get<{
  dsn?: string
  loggingLevels: ConsoleLevel[]
}>('sentry')

if (dsn) {
  init({
    dsn,
    enableLogs: true,
    environment: process.env.NODE_ENV || 'development',
    integrations: [consoleLoggingIntegration({ levels: loggingLevels })],
    sendDefaultPii: true,
  })
}
