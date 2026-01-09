import {
  getBitcoinCustodyAddress as getBitcoinCustodyAddressAction,
  getBitcoinKitAddress as getBitcoinKitAddressAction,
  getBitcoinVaultStateAddress as getBitcoinVaultStateAddressAction,
  getBitcoinWithdrawalGracePeriod as getBitcoinWithdrawalGracePeriodAction,
  getVaultByIndex,
} from 'hemi-viem/actions'
import pMemoize from 'promise-mem'
import { BtcDepositOperation } from 'types/tunnel'
import { getVaultChildIndex } from 'utils/hemiClientExtraActions'
import { type Address, type PublicClient } from 'viem'

// Vaults will have only one custody address (at least with current implementation)
export const getBitcoinCustodyAddress = pMemoize(
  (hemiClient: PublicClient, vaultAddress: Address) =>
    getBitcoinCustodyAddressAction(hemiClient, { vaultAddress }),
  {
    resolver: (hemiClient, vaultAddress) =>
      `${hemiClient.chain?.id}_${vaultAddress}`,
  },
)

// Grace period is constant per vault
export const getBitcoinVaultGracePeriod = pMemoize(
  (hemiClient: PublicClient, vaultAddress: Address) =>
    getBitcoinWithdrawalGracePeriodAction(hemiClient, { vaultAddress }),
  {
    resolver: (hemiClient, vaultAddress) =>
      `${hemiClient.chain?.id}_${vaultAddress}`,
  },
)

export const getBitcoinVaultStateAddress = pMemoize(
  (hemiClient: PublicClient, vaultAddress: Address) =>
    getBitcoinVaultStateAddressAction(hemiClient, { vaultAddress }),
  {
    resolver: (hemiClient, vaultAddress) =>
      `${hemiClient.chain?.id}_${vaultAddress}`,
  },
)

export const getVaultAddressByIndex = pMemoize(
  (hemiClient: PublicClient, vaultIndex: number) =>
    getVaultByIndex(hemiClient, { vaultIndex }),
  {
    resolver: (hemiClient, vaultIndex) =>
      `${hemiClient.chain?.id}_${vaultIndex}`,
  },
)

export const getVaultIndexByBTCAddress = pMemoize(
  // remove once se use getVaultIndexByBTCAddress below
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (hemiClient: PublicClient, deposit: BtcDepositOperation) =>
    // TODO https://github.com/hemilabs/ui-monorepo/issues/393
    // We should use hemiClient.getVaultIndexByBTCAddress({ btcAddress: deposit.to }),
    getVaultChildIndex(hemiClient),
  { resolver: (_, deposit) => `${deposit.l1ChainId}_${deposit.to}` },
)

// Memoizing it as it is unlikely to change
export const getBitcoinKitAddress = pMemoize(
  (hemiClient: PublicClient) => getBitcoinKitAddressAction(hemiClient),
  { resolver: hemiClient => hemiClient.chain?.id },
)
