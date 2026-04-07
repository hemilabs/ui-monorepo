import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { type EvmToken } from 'types/token'
import { getTokenByAddress, isEvmToken } from 'utils/token'
import { type Chain, type PublicClient, zeroAddress } from 'viem'
import { asset } from 'viem-erc4626/actions'

export const fetchHemiEarnTokens = async function ({
  chainId,
  client,
}: {
  chainId: Chain['id']
  client: PublicClient
}): Promise<EvmToken[]> {
  const vaultAddresses = getEarnVaultAddresses(chainId).filter(
    addr => addr !== zeroAddress,
  )
  const addresses = await Promise.all(
    vaultAddresses.map(addr => asset(client, { address: addr })),
  )
  return addresses
    .map(addr => getTokenByAddress(addr, chainId))
    .filter((t): t is EvmToken => t != null && isEvmToken(t))
}
