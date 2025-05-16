import { type HemiPublicClient } from 'hooks/useHemiClient'
import pMemoize from 'promise-mem'
import { BtcDepositOperation } from 'types/tunnel'
import { type Address } from 'viem'

// Vaults will have only one custody address (at least with current implementation)
export const getBitcoinCustodyAddress = pMemoize(
  (hemiClient: HemiPublicClient, vaultAddress: Address) =>
    hemiClient.getBitcoinCustodyAddress({ vaultAddress }),
  {
    resolver: (hemiClient, vaultAddress) =>
      `${hemiClient.chain.id}_${vaultAddress}`,
  },
)

// Grace period is constant per vault
export const getBitcoinVaultGracePeriod = pMemoize(
  (hemiClient: HemiPublicClient, vaultAddress: Address) =>
    hemiClient.getBitcoinWithdrawalGracePeriod({ vaultAddress }),
  {
    resolver: (hemiClient, vaultAddress) =>
      `${hemiClient.chain.id}_${vaultAddress}`,
  },
)

export const getBitcoinVaultStateAddress = pMemoize(
  (hemiClient: HemiPublicClient, vaultAddress: Address) =>
    hemiClient.getBitcoinVaultStateAddress({ vaultAddress }),
  {
    resolver: (hemiClient, vaultAddress) =>
      `${hemiClient.chain.id}_${vaultAddress}`,
  },
)

export const getVaultAddressByIndex = pMemoize(
  (hemiClient: HemiPublicClient, vaultIndex: number) =>
    hemiClient.getVaultByIndex({ vaultIndex }),
  {
    resolver: (hemiClient, vaultIndex) =>
      `${hemiClient.chain.id}_${vaultIndex}`,
  },
)

export const getVaultIndexByBTCAddress = pMemoize(
  // remove once se use getVaultIndexByBTCAddress below
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (hemiClient: HemiPublicClient, deposit: BtcDepositOperation) =>
    // TODO https://github.com/hemilabs/ui-monorepo/issues/393
    // We should use hemiClient.getVaultIndexByBTCAddress({ btcAddress: deposit.to }),
    hemiClient.getVaultChildIndex(),
  { resolver: (_, deposit) => `${deposit.l1ChainId}_${deposit.to}` },
)

// Memoizing it as it is unlikely to change
export const getBitcoinKitAddress = pMemoize(
  (hemiClient: HemiPublicClient) => hemiClient.getBitcoinKitAddress(),
  { resolver: hemiClient => hemiClient.chain.id },
)
