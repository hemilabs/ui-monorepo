'use strict'

const env = (variable, defaultValue) => process.env[variable] || defaultValue

const config = {
  absinthe: {
    apiKey: env('ABSINTHE_API_KEY'),
    apiUrl: env('ABSINTHE_API_URL', 'https://gql3.absinthe.network/v1/graphql'),
  },
  btcVaults: {
    cacheMin: Number(env('BTC_VAULTS_CACHE_MIN', '1')),
  },
  claims: {
    43111: {
      dataUrl: Number(env('CLAIMS_43111_DATA_URL')),
      tgeTime: Number(env('CLAIMS_43111_DATA_URL', '0')),
    },
    743111: {
      dataUrl: Number(env('CLAIMS_743111_TGE_TIME')),
      tgeTime: Number(env('CLAIMS_743111_TGE_TIME', '0')),
    },
  },
  origins: env('ORIGINS', 'http://localhost:3000'),
  port: Number(env('PORT', '3006')),
  redis: {
    url: env('REDIS_URL', 'redis://localhost:6379'),
  },
  tvl: {
    data: {
      sampleId: Number(env('TVL_DATA_SAMPLE_ID')),
      url: env('TVL_DATA_URL'),
    },
    revalidateMin: Number(env('TVL_REVALIDATE_MIN', '20')),
  },
}

const get = path =>
  path.split('.').reduce((partial, prop) => partial && partial[prop], config)

const api = { get }

module.exports = api
