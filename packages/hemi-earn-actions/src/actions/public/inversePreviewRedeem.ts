import { previewRedeem } from '@vetro-protocol/gateway/actions'
import { type Address, type Client } from 'viem'

// Solves `Gateway.previewRedeem(tokenOut, peggedTokenIn) === amount` for
// `peggedTokenIn` — i.e. the pegged-token amount that must leave the vault
// for the user to receive exactly `amount` of `tokenOut` on the redeem path.
//
// Why not just call `previewDeposit` and assume it's the inverse: the deposit
// path applies `mintFee` while the redeem path applies `redeemFee`. When the
// two differ (the default for production Vetro pools), the two preview
// functions are NOT inverses of each other and using `previewDeposit` would
// silently miscompute the shares to burn by ~(mintFee + redeemFee).
//
// We probe `previewRedeem` once at `peggedTokenIn = amount` and use the
// linear relationship `assetOut = peggedIn * rate` to solve for the input:
// `peggedIn = amount² / probe`, with a ceiling to compensate the Solidity
// floor-division. This self-calibrates against the contract math, so it
// works against both the production Gateway and the anvil mock (where
// `redeemFee = 0` and `probe === amount`, collapsing to `peggedIn = amount`).
// No reliance on the `redeemFee(token)` view function or its bps convention.
export const inversePreviewRedeem = async function ({
  amount,
  client,
  gatewayAddress,
  tokenOut,
}: {
  // Asset amount the user wants to receive (in `tokenOut` units).
  amount: bigint
  client: Client
  gatewayAddress: Address
  tokenOut: Address
}): Promise<bigint> {
  const probe = await previewRedeem(client, {
    address: gatewayAddress,
    peggedTokenIn: amount,
    tokenOut,
  })

  // A zero probe means the redeem path returns nothing for any peggedIn
  // (gateway disabled or asset blocked). Surface as zero so callers can gate
  // the UI; throwing here would block legitimate "loading" states.
  if (probe <= BigInt(0)) {
    return BigInt(0)
  }

  // Ceiling division: `(amount² + probe - 1) / probe` — undershooting by even
  // one wei would make the actual redeem return `amount - 1`, breaking the
  // UX promise that "the user receives exactly what they typed".
  return (amount * amount + probe - BigInt(1)) / probe
}
