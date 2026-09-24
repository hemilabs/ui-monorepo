import type { ConsoleLevel } from '@sentry/core'
import { consoleLoggingIntegration, init } from '@sentry/node'

import config from './config.ts'

const { dsn, loggingLevels } = config.get('sentry')

if (dsn) {
  init({
    dsn,
    enableLogs: true,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      consoleLoggingIntegration({ levels: loggingLevels as ConsoleLevel[] }),
    ],
    sendDefaultPii: true,
  })
}
