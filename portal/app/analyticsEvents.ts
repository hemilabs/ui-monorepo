import { LockupMonths } from 'genesis-drop-actions'
import { umamiAnalyticsContextFactory } from 'umami-analytics'

// all analytic events
const analyticsEvents = [
  // /ecosystem
  'ecosystem - bitcoinkit',
  'ecosystem - DEMOS',
  'ecosystem - pure finance',
  // header
  'header - tunnel',
  'header - txn history',
  // /genesis-drop
  'genesis-drop - failed validation',
  'genesis-drop - share eligibility',
  'genesis-drop - submit reverted',
  'genesis-drop - submit start',
  'genesis-drop - submit success',
  'genesis-drop - terms rejected',
  'genesis-drop - terms signed',
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
  // hemi earn
  'hemi earn - cancel redeem failed',
  'hemi earn - cancel redeem started',
  'hemi earn - cancel redeem success',
  'hemi earn - claim failed',
  'hemi earn - claim from vault failed',
  'hemi earn - claim from vault started',
  'hemi earn - claim from vault success',
  'hemi earn - claim started',
  'hemi earn - claim success',
  'hemi earn - deposit failed',
  'hemi earn - deposit started',
  'hemi earn - deposit success',
  'hemi earn - recover failed',
  'hemi earn - recover started',
  'hemi earn - recover success',
  'hemi earn - retry failed',
  'hemi earn - retry started',
  'hemi earn - retry success',
  'hemi earn - return shares failed',
  'hemi earn - return shares started',
  'hemi earn - return shares success',
  'hemi earn - withdraw failed',
  'hemi earn - withdraw started',
  'hemi earn - withdraw success',
  // nav bar
  'nav - hemi earn',
  'nav - dex',
  'nav - docs',
  'nav - ecosystem',
  'nav - explorer',
  'nav - hbk',
  'nav - genesis drop',
  'nav - get started',
  'nav - hemi stake',
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
  'stake - stake failed',
  'stake - stake started',
  'stake - stake success',
  'stake - stake more',
  'stake - unstake failed',
  'stake - unstake started',
  'stake - unstake success',
  // /hemi-stake
  'hemi stake - approve failed',
  'hemi stake - approve increase amount reverted',
  'hemi stake - approve reverted',
  'hemi stake - collect rewards transaction reverted',
  'hemi stake - collect rewards transaction succeeded',
  'hemi stake - filter active',
  'hemi stake - filter burned',
  'hemi stake - increase amount success',
  'hemi stake - increase amount transaction reverted',
  'hemi stake - increase unlock time reverted',
  'hemi stake - increase unlock time success',
  'hemi stake - lock creation failed validation',
  'hemi stake - lock creation failed',
  'hemi stake - lock creation reverted',
  'hemi stake - lock creation success',
  'hemi stake - signed collect rewards',
  'hemi stake - signed increase amount',
  'hemi stake - signed increase unlock time',
  'hemi stake - signed lock creation',
  'hemi stake - signed withdraw',
  'hemi stake - signing approve error',
  'hemi stake - signing collect rewards error',
  'hemi stake - signing increase amount error',
  'hemi stake - signing increase unlock time error',
  'hemi stake - signing lock creation error',
  'hemi stake - signing withdraw error',
  'hemi stake - unexpected error',
  'hemi stake - withdraw success',
  'hemi stake - withdraw transaction reverted',
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
  'partner bridge',
  'select token',
  'to network',
  'toggle to 3rd party bridge',
  'toggle to hemi tunnel',
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
  'nav - rubic',
  'nav - dzap',
  'nav - 1delta',
  'nav - eisen',
  'nav - sushi',
  'nav - oku',
  'nav - izumi',
  'nav - dodo',
  'nav - atlas',
  'nav - lunarfi',
  'nav - brownfi',
  // custom Tokens for the tunnel
  'custom erc20 - cancel',
  'custom erc20 - open modal',
  'custom erc20 - save token',
  // save tokens in user's wallet
  'save token wallet - error',
  'save token wallet - init',
  'save token wallet - ok',
  // earn rewards card
  'earn rewards - open link',
  'earn rewards - close',
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

// These events require an ERC20 address
type AnalyticsEventsWithERC20 = Extract<
  AnalyticsEvent,
  | 'custom erc20 - cancel'
  | 'custom erc20 - open modal'
  | 'custom erc20 - save token'
  | 'save token wallet - error'
  | 'save token wallet - init'
  | 'save token wallet - ok'
>

// this event requires a partner name
type AnalyticsEventsWithPartnerBridge = Extract<
  AnalyticsEvent,
  'partner bridge'
>

// these events require a Lockup Month period
type AnalyticsEventsWithGenesisDropData = Extract<
  AnalyticsEvent,
  | 'genesis-drop - failed validation'
  | 'genesis-drop - submit reverted'
  | 'genesis-drop - submit start'
  | 'genesis-drop - submit success'
  | 'genesis-drop - terms signed'
  | 'genesis-drop - terms rejected'
>

type WalletChainData = { wallet: string }
type CustomERC20Data = { address: string }
type PartnerBridgeData = { partner: string }
type GenesisDropData = { lockupMonths: LockupMonths }

// Create a mapped type that maps each key to its corresponding value type
export type EventDataMap = {
  [K in AnalyticsEvent]: K extends AnalyticsEventsWithWallet
    ? WalletChainData
    : K extends AnalyticsEventsWithERC20
      ? CustomERC20Data
      : K extends AnalyticsEventsWithPartnerBridge
        ? PartnerBridgeData
        : K extends AnalyticsEventsWithGenesisDropData
          ? GenesisDropData
          : never
}

export const { UmamiAnalyticsProvider, useUmami } =
  umamiAnalyticsContextFactory<AnalyticsEvents, EventDataMap>(analyticsEvents)
