import type { Address, Client } from 'viem'
import { balanceOf, convertToAssets } from 'viem-erc4626/actions'

import { getBtcStakingVaultContractAddress } from '../../constants'

export const getUserBalance = async function ({
  account,
  client,
}: {
  account: Address
  client: Client
}) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const vaultAddress = getBtcStakingVaultContractAddress(client.chain.id)

  return balanceOf(client, {
    account,
    address: vaultAddress,
  }).then(shares =>
    convertToAssets(client, {
      address: vaultAddress,
      shares,
    }),
  )
}
