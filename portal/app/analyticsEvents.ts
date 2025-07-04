import { umamiAnalyticsContextFactory } from 'umami-analytics-next'

// all analytic events
const analyticsEvents = [
  // /ecosystem
  'ecosystem - bitcoinkit',
  'ecosystem - cryptochords',
  'ecosystem - DEMOS',
  'ecosystem - hatchlings',
  'ecosystem - pure finance',
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
  'tut - pop miner cli',
  'tut - setup btc',
  'tut - setup evm',
  'tut - setup safe',
  'tut - swap tokens',
  'tut - tunnel assets',
  'tut - tunnel eth',
  'tut - wallet setup',
  // nav bar
  'nav - dex',
  'nav - docs',
  'nav - ecosystem',
  'nav - explorer',
  'nav - hbk',
  'nav - get started',
  'nav - network status',
  'nav - mainnet to testnet',
  'nav - testnet to mainnet',
  'nav - tools',
  'nav - faucet',
  'nav - pure finance',
  'nav - stake',
  'nav - tunnel',
  'nav - language',
  'nav - legal and privacy',
  // socials
  'nav - discord',
  'nav - gitHub',
  'nav - linkedIn',
  'nav - youtube',
  'nav - x',
  // /stake
  'stake - click earn points card',
  'stake - close earn points card',
  'stake - learn stake',
  'stake - stake failed',
  'stake - stake started',
  'stake - stake success',
  'stake - stake more',
  'stake - unstake failed',
  'stake - unstake started',
  'stake - unstake success',
  // /transaction-history
  'txn refresh',
  'txn filter - all',
  'txn filter - btc',
  'txn filter - eth',
  // /tunnel
  'btc - challenge failed',
  'btc - challenge started',
  'btc - challenge success',
  'btc - confirm dep started',
  'btc - confirm dep failed',
  'btc - confirm dep success',
  'btc - dep failed',
  'btc - dep started',
  'btc - dep success',
  'btc - withdraw failed',
  'btc - withdraw started',
  'btc - withdraw success',
  'evm - dep failed',
  'evm - dep started',
  'evm - dep success',
  'evm - claim failed',
  'evm - claim started',
  'evm - claim success',
  'evm - init withdraw failed',
  'evm - init withdraw started',
  'evm - init withdraw success',
  'evm - prove failed',
  'evm - prove started',
  'evm - prove success',
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
  // dex's
  'nav - 1delta',
  'nav - eisen',
  'nav - sushi',
  'nav - oku',
  'nav - izumi',
  'nav - dodo',
  'nav - atlas',
  'nav - passdex',
  // custom Tokens for the tunnel
  'custom erc20 - cancel',
  'custom erc20 - open modal',
  'custom erc20 - save token',
] as const

type AnalyticsEvents = typeof analyticsEvents
export type AnalyticsEvent = (typeof analyticsEvents)[number]

// These require wallet info
type AnalyticsEventsWithWallet = Extract<
  AnalyticsEvent,
  | 'btc connected'
  | 'btc copy'
  | 'btc disconnected'
  | 'evm connected'
  | 'evm copy'
  | 'evm disconnected'
>

// These events require a custom ERC20 address
type AnalyticsEventsWithCustomERC20 = Extract<
  AnalyticsEvent,
  | 'custom erc20 - cancel'
  | 'custom erc20 - open modal'
  | 'custom erc20 - save token'
>

type WalletChainData = { wallet: string }
type CustomERC20Data = { address: string }

// Create a mapped type that maps each key to its corresponding value type
type EventDataMap = {
  [K in AnalyticsEvent]: K extends AnalyticsEventsWithWallet
    ? WalletChainData
    : K extends AnalyticsEventsWithCustomERC20
      ? CustomERC20Data
      : never
}

export const { UmamiAnalyticsProvider, useUmami } =
  umamiAnalyticsContextFactory<AnalyticsEvents, EventDataMap>(analyticsEvents)
