'use strict'

const env = (variable, defaultValue) => process.env[variable] || defaultValue

const config = {
  accounts: {
    dead: '0x000000000000000000000000000000000000dEaD',
  },
  contracts: {
    hemi: {
      bnb: '0x5ffd0eadc186af9512542d0d5e5eafc65d5afc5b',
      eth: '0xEb964A1A6fAB73b8c72A0D15c7337fA4804F484d',
      hemi: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
    },
    merkleBox: '0x9Ab3660ceE733332785cEa09D1a4Ff222F31aE54',
    safe: '0x694fA0816999Da16E8783C0f5cDE68c13a33C4e6',
    veHemi: '0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89',
  },
  redis: {
    url: env('REDIS_URL', 'redis://localhost:6379'),
  },
  refreshSupplyMin: Number(env('REFRESH_SUPPLY_MIN', '5')),
  rpcUrls: {
    bnb: env('RPC_URL_BNB', 'https://56.rpc.thirdweb.com'),
    eth: env('RPC_URL_ETH', 'https://eth.merkle.io'),
    hemi: env('RPC_URL_HEMI', 'https://rpc.hemi.network/rpc'),
  },
  sentry: {
    dsn: env('SENTRY_DSN', ''),
    loggingLevels: env('SENTRY_LOGGING_LEVELS', 'log,warn,error').split(','),
  },
  supply: {
    correction: BigInt(env('SUPPLY_CORRECTION', '0')),
    merkleLocked: BigInt(env('SUPPLY_MERKLE_LOCKED', '50')),
    opAddresses: env('SUPPLY_OP_ADDRESSES', '').split(','),
  },
}

const get = path =>
  path.split('.').reduce((partial, prop) => partial && partial[prop], config)

const api = { get }

module.exports = api
