import { hemiMainnet } from 'networks/hemiMainnet'
import { isRelativeUrl, isValidUrl } from 'utils/url'
import { getVeHemiEpochRewardsContractAddress } from 've-hemi-rewards'
import { type Address, isAddress } from 'viem'

// A blank `VITE_VE_HEMI_EPOCH_REWARDS=` is "not configured", not an address of "", and a
// typo is not an address either. Both used to be cast straight to `Address`, which
// switched the dashboard to the epoch generation and aimed every read at nothing.
const readAddressOverride = function (name: string) {
  const value = import.meta.env[name] as string | undefined
  const trimmed = value?.trim()
  return trimmed !== undefined && isAddress(trimmed)
    ? (trimmed as Address)
    : undefined
}

/**
 * The epoch rewards contract for a chain, or `undefined` where there is none.
 *
 * Same idea as the tunnel-contract overrides in `utils/chain.ts` - a `VITE_` variable
 * wins over what is deployed, so everyone can point at their own scenario devnet - but
 * chain-guarded, since a devnet address reaching mainnet would show the wrong money
 * rather than fail. Vite inlines these at build time, so an unset variable is simply
 * absent from a production bundle.
 */
export const getEpochRewardsAddress = function (chainId: number) {
  const override = readAddressOverride('VITE_VE_HEMI_EPOCH_REWARDS')

  return chainId === hemiMainnet.id
    ? getVeHemiEpochRewardsContractAddress(chainId)
    : (override ?? getVeHemiEpochRewardsContractAddress(chainId))
}

/**
 * Where to start reading `Claimed` logs on this chain, or `undefined` to work it out.
 *
 * Optional on purpose: a scenario devnet should need only the two addresses, and the
 * block is discoverable from the contract. Set it where an endpoint will not serve
 * historical `getCode`, or to skip the discovery entirely.
 */
export const getEpochRewardsStartBlock = function (chainId: number) {
  if (chainId === hemiMainnet.id) {
    return undefined
  }
  const value = import.meta.env.VITE_VE_HEMI_EPOCH_REWARDS_FROM_BLOCK as
    | string
    | undefined
  const trimmed = value?.trim()
  return trimmed !== undefined && /^[0-9]+$/.test(trimmed)
    ? BigInt(trimmed)
    : undefined
}

// Reads go through the Lens; writes go to the rewards contract itself.
export const getEpochRewardsLensAddress = function (chainId: number) {
  const override = readAddressOverride('VITE_VE_HEMI_EPOCH_REWARDS_LENS')

  return chainId === hemiMainnet.id ? undefined : override
}

/**
 * Which rewards contract a chain is on.
 *
 * `continuous` is the original one: a single accrued figure per position, claimed by
 * whoever holds the NFT now. `epoch` is `VeHemiEpochRewards`, with per-epoch per-class
 * pots owed to whoever held the position at the time.
 *
 * Both addresses have to resolve. Every epoch read goes through the Lens, so a chain
 * with only the rewards address would disable the legacy reads and enable reads that
 * can never run - and a disabled query stays pending, so it paints a permanent skeleton
 * instead of an error.
 *
 * The capture-before-withdraw guard deliberately uses a weaker condition: it needs only
 * the rewards address, because burning a position is destructive with or without a Lens.
 */
export const getRewardsGeneration = (chainId: number) =>
  getEpochRewardsAddress(chainId) === undefined ||
  getEpochRewardsLensAddress(chainId) === undefined
    ? ('continuous' as const)
    : ('epoch' as const)

/**
 * Whether the APR figure means anything on this chain.
 *
 * APR is a dot product of a per-veHEMI rewards series against a weight decay, and that
 * series describes one continuously accruing pot. The epoch contract pays per epoch and
 * per class against per-class denominators, so the same arithmetic describes a different
 * system rather than approximating this one. Rebuilding it per class is follow-on work.
 *
 * A function rather than the same comparison in two places: the query and the cell that
 * renders it have to agree, or a gated fetch leaves an ungated skeleton on screen.
 */
export const isAprSupported = (chainId: number) =>
  getRewardsGeneration(chainId) === 'continuous'

/**
 * Whether the per-veHEMI rewards series can be fetched on this build.
 *
 * A relative `VITE_PORTAL_API_URL` counts - it is `/portal-api` through the Vite dev
 * proxy in development, which the browser resolves fine. Requiring an absolute URL here
 * switched the series, and the APR with it, off for all of local dev.
 */
export const isRewardsSeriesConfigured = function () {
  const portalApiUrl = import.meta.env.VITE_PORTAL_API_URL
  return (
    portalApiUrl !== undefined &&
    (isValidUrl(portalApiUrl) || isRelativeUrl(portalApiUrl))
  )
}
