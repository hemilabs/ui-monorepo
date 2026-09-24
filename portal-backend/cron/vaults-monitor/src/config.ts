const env = (variable: string, defaultValue: string) =>
  process.env[variable] || defaultValue

const settings = {
  apiUrl: env('API_URL', 'http://localhost:3006'),
  maxBlocksBehind: Number.parseInt(env('MAX_BLOCKS_BEHIND', '4')),
  sentry: {
    dsn: env('SENTRY_DSN', ''),
    loggingLevels: env('SENTRY_LOGGING_LEVELS', 'log,warn,error').split(','),
  },
  slack: {
    mention: env('SLACK_MENTION', ''),
    webhookUrl: env('SLACK_WEBHOOK_URL', ''),
  },
  vaultsMonitoringMin: Number.parseInt(env('VAULTS_MONITORING_MIN', '5')),
}

type Config = typeof settings

const get = <K extends keyof Config>(key: K) => settings[key]

export const config = { get }
