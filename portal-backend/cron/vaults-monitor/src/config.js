'use strict'

const env = (variable, defaultValue) => process.env[variable] || defaultValue

const config = {
  apiUrl: env('API_URL', 'http://localhost:3006'),
  maxBlocksBehind: Number.parseInt(env('MAX_BLOCKS_BEHIND', '4')),
  slack: {
    mention: env('SLACK_MENTION'),
    webhookUrl: env('SLACK_WEBHOOK_URL'),
  },
  vaultsMonitoringMin: Number.parseInt(env('VAULTS_MONITORING_MIN', '5')),
}

const get = path =>
  path.split('.').reduce((partial, prop) => partial && partial[prop], config)

const api = { get }

module.exports = api
