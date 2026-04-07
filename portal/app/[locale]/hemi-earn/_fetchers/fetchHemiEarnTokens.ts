import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { getTokenByAddress, isEvmToken } from 'utils/token'
import { type Chain, type PublicClient, zeroAddress } from 'viem'
import { asset } from 'viem-erc4626/actions'

import { type VaultToken } from '../types'

export const fetchHemiEarnTokens = async function ({
  chainId,
  client,
}: {
  chainId: Chain['id']
  client: PublicClient
}): Promise<VaultToken[]> {
  const vaultAddresses = getEarnVaultAddresses(chainId)
  const results = await Promise.all(
    vaultAddresses.map(addr =>
      addr === zeroAddress
        ? Promise.resolve(null)
        : asset(client, { address: addr }),
    ),
  )
  return results.reduce<VaultToken[]>(function (acc, tokenAddress, index) {
    if (tokenAddress == null) {
      return acc
    }
    const token = getTokenByAddress(tokenAddress, chainId)
    if (token != null && isEvmToken(token)) {
      acc.push({ token, vaultAddress: vaultAddresses[index] })
    }
    return acc
  }, [])
}
