import { type Client } from 'viem'

type ExtraActionsParams = {
  defaultBitcoinVaults: Record<string, number>
  pastBitcoinVaults: Record<string, number[]>
}

export const hemiPublicExtraActions =
  ({ defaultBitcoinVaults, pastBitcoinVaults }: ExtraActionsParams) =>
  (client: Client) => ({
    // In incoming iterations, the vault index will be determined programmatically
    // once there's a way to get the "most adequate" custodial and support
    // multiple types of vaults.
    // TODO see https://github.com/hemilabs/ui-monorepo/issues/393
    getVaultChildIndex: () =>
      // @ts-expect-error can't use PublicClient in parameter as fails to compile.
      Promise.resolve(defaultBitcoinVaults[client.chain.id]),
    getVaultHistoricVaultIndexes() {
      // @ts-expect-error can't use PublicClient in parameter as fails to compile.
      const currentVault = defaultBitcoinVaults[client.chain.id]
      // @ts-expect-error can't use PublicClient in parameter as fails to compile.
      const pastVaults = pastBitcoinVaults[client.chain.id]
      return Promise.resolve([...pastVaults, currentVault].sort())
    },
  })
