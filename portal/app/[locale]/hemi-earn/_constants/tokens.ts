import { SVETBTC_OFT_ADDRESS, VETBTC_PEGGED_ADDRESS } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { type EvmToken } from 'types/token'
import { toChecksumAddress } from 'utils/address'
import { type Address } from 'viem'

// Pattern mirrors Vetro's `knownTokens` in
// `vetro-monorepo/web/src/utils/tokenList.ts`. Share addresses are
// imported from `hemi-earn-actions` so the package stays the single source
// of truth for on-chain identifiers.
const HEMI_LOGO_BASE = 'https://hemilabs.github.io/token-list/l1Logos'

const HEMI_EARN_TOKENS: EvmToken[] = [
  // Share OFT — address imported from the package; metadata is portal-side
  // since the public token list doesn't carry it.
  {
    address: SVETBTC_OFT_ADDRESS,
    chainId: hemi.id,
    decimals: 18,
    logoURI: `${HEMI_LOGO_BASE}/svetbtc.svg`,
    name: 'Staked Vetro BTC',
    symbol: 'svetBTC',
  },

  // Pegged token (vetBTC) — what `stakingVault.asset()` returns. The portal
  // prices share balances by first converting to this token (decimals +
  // priceSymbol below), since the public price feed doesn't list svetBTC.
  {
    address: VETBTC_PEGGED_ADDRESS,
    chainId: hemi.id,
    decimals: 18,
    extensions: { priceSymbol: 'BTC' },
    logoURI: `${HEMI_LOGO_BASE}/vetbtc.svg`,
    name: 'Vetro BTC',
    symbol: 'vetBTC',
  },
]

// Lookup by checksum-normalized address + chainId, matching the shape of
// `getTokenByAddress` in `utils/token.ts`.
export const getHemiEarnToken = function (
  address: Address,
  chainId: EvmToken['chainId'],
): EvmToken | undefined {
  const normalized = toChecksumAddress(address)
  return HEMI_EARN_TOKENS.find(
    t =>
      t.chainId === chainId &&
      toChecksumAddress(t.address as Address) === normalized,
  )
}
