import { type NetworkType } from 'hooks/useNetworkType'
import { umamiAnalyticsContextFactory } from 'umami-analytics-next'

// all analytic events
export const analyticsEvents = [
  // /demos
  'demos - bitcoinkit',
  'demos - cryptochords',
  'demos - hatchlings',
  'demos - pure finance',
  // header
  'header - tunnel',
  'header - txn history',
  // /get-started
  'add to wallet - hemi mainnet',
  'add to wallet - hemi sepolia',
  'add to wallet - sepolia',
  'bitcoin faucet',
  'ethereum faucet',
  'fund wallet - moonpay',
  'fund wallet - oku',
  'fund wallet - sushi',
  'hemi discord faucet',
  'network - automatic',
  'network - manual',
  'tut - add hemi',
  'tut - create capsule',
  'tut - deploy contract',
  'tut - deploy erc20',
  'tut - dev tooling',
  'tut - hello world',
  'tut - get btc balance',
  'tut - learn more',
  'tut - pop miner',
  'tut - pop miner app',
  'tut - pop miner cli',
  'tut - setup btc',
  'tut - setup evm',
  'tut - setup safe',
  'tut - swap tokens',
  'tut - tunnel assets',
  'tut - tunnel eth',
  'tut - wallet setup',
  // nav bar
  'nav - demos',
  'nav - dex',
  'nav - docs',
  'nav - explorer',
  'nav - hbk',
  'nav - get started',
  'nav - network status',
  'nav - mainnet to testnet',
  'nav - testnet to mainnet',
  'nav - tools',
  'nav - faucet',
  'nav - pure finance',
  'nav - tunnel',
  'nav - web pop miner',
  // socials
  'nav - discord',
  'nav - gitHub',
  'nav - linkedIn',
  'nav - youtube',
  'nav - x',
  // /transaction-history
  'txn refresh',
  'txn filter - all',
  'txn filter - btc',
  'txn filter - eth',
  // /tunnel
  'evm - dep failed',
  'evm - dep started',
  'evm - dep success',
  'from network',
  'form - connect wallets',
  'select token',
  'to network',
  // wallets drawer
  'btc connect',
  'btc connected',
  'btc copy',
  'btc disconnected',
  'close wallet drawer',
  'connect wallets',
  'evm connect',
  'evm connected',
  'evm copy',
  'evm disconnected',
] as const

type AnalyticsEvents = typeof analyticsEvents
export type AnalyticsEvent = (typeof analyticsEvents)[number]

// These require chain and wallet info
type AnalyticsEventsWithWallet = Extract<
  AnalyticsEvent,
  | 'btc connected'
  | 'btc copy'
  | 'btc disconnected'
  | 'evm connected'
  | 'evm copy'
  | 'evm disconnected'
>

// These types are the ones that are required to be added the chainInfo
type EventChainData = { chain: NetworkType }

export type AnalyticsEventsWithChain = Exclude<
  Exclude<
    AnalyticsEvent,
    // These are not tracking by anything
    | 'add to wallet - hemi mainnet'
    | 'add to wallet - hemi sepolia'
    | 'add to wallet - sepolia'
    | 'bitcoin faucet'
    | 'ethereum faucet'
    | 'fund wallet - moonpay'
    | 'fund wallet - oku'
    | 'fund wallet - sushi'
    | 'hemi discord faucet'
    | 'nav - discord'
    | 'nav - gitHub'
    | 'nav - linkedIn'
    | 'nav - mainnet to testnet'
    | 'nav - testnet to mainnet'
    | 'nav - youtube'
    | 'nav - x'
    | 'network - automatic'
    | 'network - manual'
    | 'tut - add hemi'
    | 'tut - create capsule'
    | 'tut - deploy contract'
    | 'tut - deploy erc20'
    | 'tut - dev tooling'
    | 'tut - hello world'
    | 'tut - get btc balance'
    | 'tut - learn more'
    | 'tut - pop miner'
    | 'tut - pop miner app'
    | 'tut - pop miner cli'
    | 'tut - setup btc'
    | 'tut - setup evm'
    | 'tut - setup safe'
    | 'tut - swap tokens'
    | 'tut - tunnel assets'
    | 'tut - tunnel eth'
    | 'tut - wallet setup'
  >,
  AnalyticsEventsWithWallet
>

type WalletChainData = EventChainData & { wallet: string }

// Create a union type from the arrays
type KeysWithEventData = AnalyticsEventsWithChain | AnalyticsEventsWithWallet

// Create a mapped type that maps each key to its corresponding value type
type EventDataMap = {
  [K in KeysWithEventData]: K extends AnalyticsEventsWithWallet
    ? WalletChainData
    : K extends AnalyticsEventsWithChain
      ? EventChainData
      : { [key: string]: unknown }
}

export const { UmamiAnalyticsProvider, useUmami } =
  umamiAnalyticsContextFactory<AnalyticsEvents, EventDataMap>(analyticsEvents)
