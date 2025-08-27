'use strict'

const config = require('config')
const Sentry = require('@sentry/node')

const { dsn, loggingLevels } = config.get('sentry')

if (dsn) {
  Sentry.init({
    dsn,
    enableLogs: true,
    environment: process.env.NODE_ENV || 'development',
    integrations: [Sentry.consoleLoggingIntegration({ levels: loggingLevels })],
    sendDefaultPii: true,
  })
}
