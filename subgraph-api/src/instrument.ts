import 'dotenv/config'
import type { ConsoleLevel } from '@sentry/core'
import * as Sentry from '@sentry/node'
import config from 'config'

const { dsn, loggingLevels } = config.get<{
  dsn: string
  loggingLevels: ConsoleLevel[]
}>('sentry')

if (dsn) {
  Sentry.init({
    dsn,
    enableLogs: true,
    environment: process.env.NODE_ENV || 'development',
    integrations: [Sentry.consoleLoggingIntegration({ levels: loggingLevels })],
    sendDefaultPii: true,
  })
}
