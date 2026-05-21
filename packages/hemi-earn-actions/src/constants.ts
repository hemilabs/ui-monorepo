import { sVetBtcAddress } from '@vetro-protocol/earn'
import { gateways } from '@vetro-protocol/gateway'
import { getPeggedToken } from '@vetro-protocol/gateway/actions'
import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'

// TODO: placeholder — replace with the deployed Router on Hemi mainnet once
// the addresses are confirmed.
export const HEMI_EARN_ROUTER_ADDRESS: Address = zeroAddress

// TODO: placeholder — replace with the deployed Agent on Ethereum mainnet
// once the addresses are confirmed. Used by the portal to quote the
// LayerZero fulfillment fee from the remote chain.
export const HEMI_EARN_AGENT_ADDRESS: Address = zeroAddress

// Named address constants for each share OFT registered on the Router.
// Exported individually so the portal (and other consumers) can import the
// canonical address without re-declaring it. Mirrors Vetro's pattern
// (`sVetBtcAddress`, `sVusdAddress` in `@vetro-protocol/earn`).
//
// TODO: placeholder — replace with the production svetBTC OFT on Hemi once
// the addresses are confirmed.
export const SVETBTC_OFT_ADDRESS: Address = zeroAddress

// Resolve the Ethereum-side Vetro Gateway addresses once at module load. The
// `pegBaseSymbol` lookup is the pattern documented in the
// `@vetro-protocol/gateway` README and on the `Gateway` JSDoc ("Portal-API
// symbol used to convert this gateway's peg unit into USD"). After this
// bootstrap, the rest of the code works purely with addresses.
function findVetroGateway(pegBaseSymbol: string) {
  const gateway = gateways.find(g => g.pegBaseSymbol === pegBaseSymbol)
  if (!gateway) {
    throw new Error(
      `Vetro gateway with pegBaseSymbol="${pegBaseSymbol}" not found in @vetro-protocol/gateway`,
    )
  }
  return gateway.address
}

const vetBtcGateway = findVetroGateway('BTC')

// Hemi-side share OFT + its Ethereum-side anchors. The Agent on Ethereum
// resolves the same set on-chain via `assetsData(asset).asset().gateway()`;
// we mirror it here so the portal can preview cross-chain results without
// round-tripping to the Agent first.
export type HemiEarnShareEntry = {
  // Ethereum-side Vetro Gateway, from `@vetro-protocol/gateway`. The
  // pegged token is not stored here — it's resolved on-chain via the
  // gateway's `PEGGED_TOKEN()` view (see `getPeggedTokenForShare`).
  gateway: Address
  // Hemi-side OFT (svetBTC, sVUSD). Placeholder until SC team confirms.
  shareOft: Address
  // Ethereum-side ERC-4626 sVetToken, from `@vetro-protocol/earn`.
  stakingVault: Address
}

// `shareOft` is the only field no Vetro package can cover (Hemi-side); it
// stays as `zeroAddress` until SC team confirms the OFT deployments. The
// Ethereum-side fields (`stakingVault`, `gateway`) come from the published
// packages.
export const HEMI_EARN_SHARES_REGISTRY: readonly HemiEarnShareEntry[] = [
  {
    gateway: vetBtcGateway,
    shareOft: SVETBTC_OFT_ADDRESS,
    stakingVault: sVetBtcAddress,
  },
  // VUSD entry will be added when SVUSD_OFT_ADDRESS lands:
  // {
  //   gateway: vUsdGateway,
  //   shareOft: SVUSD_OFT_ADDRESS,
  //   stakingVault: sVusdAddress,
  // },
] as const

// Unique share OFT addresses registered on the Router. Used to enumerate
// share-keyed routes (`generateStaticParams`). Filters out `zeroAddress` so
// unconfigured rows don't leak into the UI.
export const HEMI_EARN_SHARES: readonly Address[] =
  HEMI_EARN_SHARES_REGISTRY.map(s => s.shareOft)

// One deposit asset registered on the Router. `asset` is the Hemi-side OFT
// the user holds and passes to `requestDeposit`; `share` is the share OFT
// it settles into (must be one of `HEMI_EARN_SHARES`).
export type HemiEarnAsset = {
  asset: Address
  share: Address
}

// Hardcoded asset → share registry. The Router exposes `assetsData(asset)`
// for per-key lookups but no enumeration view, so the portal mirrors the
// list here. Adding a new deposit asset to an existing share requires
// appending an entry and shipping a new portal build — tracked as a
// follow-up to migrate to a subgraph (or a contract-level enumeration
// getter) once one of those lands.
//
// TODO: populate with the `(asset OFT, share OFT)` pairs once
// SC team deploys.
export const HEMI_EARN_SUPPORTED_ASSETS: readonly HemiEarnAsset[] = [] as const

export const getHemiEarnRouterAddress = () => HEMI_EARN_ROUTER_ADDRESS

export const getHemiEarnAgentAddress = () => HEMI_EARN_AGENT_ADDRESS

export const getHemiEarnShares = () =>
  HEMI_EARN_SHARES.filter(s => !isAddressEqual(s, zeroAddress))

// Deposit assets registered for any of the active share OFTs. Filters out
// any entry whose `asset` or `share` is still the zero-address placeholder.
export const getHemiEarnSupportedAssets = () =>
  HEMI_EARN_SUPPORTED_ASSETS.filter(
    ({ asset, share }) =>
      !isAddressEqual(asset, zeroAddress) &&
      !isAddressEqual(share, zeroAddress),
  )

function findShareEntry(shareOft: Address) {
  const entry = HEMI_EARN_SHARES_REGISTRY.find(s =>
    isAddressEqual(s.shareOft, shareOft),
  )
  if (!entry) {
    throw new Error(`Share OFT not registered in Hemi Earn: ${shareOft}`)
  }
  return entry
}

// Ethereum-side StakingVault (ERC-4626 sVetToken) for a Hemi-side share OFT.
// Throws when the share is not registered so callers fail loudly instead of
// reading from `zeroAddress`.
export const getStakingVaultForShare = (shareOft: Address) =>
  findShareEntry(shareOft).stakingVault

// Ethereum-side Vetro Gateway for a Hemi-side share OFT.
export const getGatewayForShare = (shareOft: Address) =>
  findShareEntry(shareOft).gateway

// Ethereum-side pegged token (vBTC, vUSD) for a Hemi-side share OFT.
// Resolved on-chain via the gateway's `PEGGED_TOKEN()` view — callers
// should wrap in `useQuery` / `useQueries` and cache the result (the
// pegged token is immutable per gateway deployment).
export const getPeggedTokenForShare = (
  client: Client,
  shareOft: Address,
): Promise<Address> =>
  getPeggedToken(client, { address: findShareEntry(shareOft).gateway })
