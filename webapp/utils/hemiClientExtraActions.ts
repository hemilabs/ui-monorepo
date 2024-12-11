import { type Client } from 'viem'

export const hemiPublicExtraActions =
  ({ defaultBitcoinVaults }) =>
  (client: Client) => ({
    // TODO get other parameters such as:
    // - MINIMUM_DEPOSIT_SATS and MINIMUM_WITHDRAWAL_SATS
    // - MIN_BITCOIN_CONFIRMATIONS_FOR_DEPOSIT (+2 as hvm runs 2 blocks behind)

    // In incoming iterations, the vault index will be determined programmatically
    // once there's a way to get the "most adequate" custodial and support
    // multiple types of vaults.
    // See https://github.com/hemilabs/ui-monorepo/issues/393
    getVaultChildIndex: () =>
      // @ts-expect-error can't use PublicClient as fails to compile.
      Promise.resolve(defaultBitcoinVaults[client.chain.id]),
  })
