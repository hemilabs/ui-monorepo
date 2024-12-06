// FIXME to allow importing the ABIs, add:
// hemi-viem/package.json.exports[./*].import:./_esm/*

import { bitcoinTunnelManagerAbi } from 'hemi-viem/contracts/bitcoin-tunnel-manager'
import { simpleBitcoinVaultAbi } from 'hemi-viem/contracts/simple-bitcoin-vault'
import { simpleBitcoinVaultStateAbi } from 'hemi-viem/contracts/simple-bitcoin-vault-state'
import { parseEventLogs } from 'viem'

// TODO All these actions shall be moved into hemi-viem v2.

export const hemiPublicExtraActions =
  ({ defaultBitcoinVaults }) =>
  client => ({
    decodeBitcoinTunnelManagerLogs: logs =>
      parseEventLogs({ abi: bitcoinTunnelManagerAbi, logs }),

    // With the vault id, get its address from the tunnel manager, then get its
    // state address, and with the uuid, check if the bitcoin transaction was
    // sent. The withdrawalsToStatus receive just the lower 32 bits of the uuid
    // and will return 0 if the transaction was not posted yet.
    getBitcoinWithdrawalBitcoinTxId: (vaultIndex, uuid) =>
      client
        .getVaultByIndex({ vaultIndex })
        .then(address =>
          client.getBitcoinVaultStateAddress({
            vaultAddress: address,
          }),
        )
        .then(address =>
          client.readContract({
            abi: simpleBitcoinVaultStateAbi,
            address,
            args: [Number(uuid & BigInt(0xffffffff))],
            functionName: 'withdrawalsToStatus',
          }),
        ),

    // Get the grace period set in the vault. This value is constant and hardcoded
    // in the contract so it could be cached per vault instance.
    getBitcoinWithdrawalGracePeriod: vaultIndex =>
      client.getVaultByIndex({ vaultIndex }).then(address =>
        client.readContract({
          abi: simpleBitcoinVaultAbi,
          address,
          functionName: 'WITHDRAWAL_GRACE_PERIOD_SECONDS',
        }),
      ),

    // TODO get other parameters such as:
    // - MINIMUM_DEPOSIT_SATS and MINIMUM_WITHDRAWAL_SATS
    // - MIN_BITCOIN_CONFIRMATIONS_FOR_DEPOSIT (+2 as hvm runs 2 blocks behind)

    // In incoming iterations, the vault index will be determined programmatically
    // once there's a way to get the "most adequate" custodial and support
    // multiple types of vaults.
    // See https://github.com/hemilabs/ui-monorepo/issues/393
    getVaultChildIndex: () =>
      Promise.resolve(defaultBitcoinVaults[client.chain.id]),
  })
