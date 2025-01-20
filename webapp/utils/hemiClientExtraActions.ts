import { EvmToken } from 'types/token'
import { Address, type Client, Hash } from 'viem'

// Fake resolving to a hash address so typings are defined. Here, a TX hash from the blockchain would be returned
// Note that this won't be in checksum format
const generateFakeTxHashAddress = () =>
  '0x'.concat(
    [...Array(64)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('') as Hash,
  )

export const hemiPublicExtraActions =
  ({ defaultBitcoinVaults }) =>
  (client: Client) => ({
    // In incoming iterations, the vault index will be determined programmatically
    // once there's a way to get the "most adequate" custodial and support
    // multiple types of vaults.
    // TODO see https://github.com/hemilabs/ui-monorepo/issues/393
    getVaultChildIndex: () =>
      // @ts-expect-error can't use PublicClient in parameter as fails to compile.
      Promise.resolve(defaultBitcoinVaults[client.chain.id]),
  })

// This will eventually be removed. See issue below
export const hemiWalletExtraActions = () => () => ({
  // TODO TBD real implementation. See https://github.com/hemilabs/ui-monorepo/issues/774
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stakeToken: (_: { amount: bigint; from: Address; token: EvmToken }) =>
    Promise.resolve(generateFakeTxHashAddress()),
  // TODO TBD real implementation. See https://github.com/hemilabs/ui-monorepo/issues/774
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unstakeToken: (_: { amount: bigint; from: Address; token: EvmToken }) =>
    Promise.resolve(generateFakeTxHashAddress()),
})
