import { Token } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { Address, PublicClient } from 'viem'
import { getErc20TokenBalance } from 'viem-erc20/actions'

type Props = {
  account: Address
  client: PublicClient
  isConnected: boolean
  token: Token
}

export async function getTokenBalance({
  account,
  client,
  isConnected,
  token,
}: Props) {
  if (!isConnected) return BigInt(0)

  try {
    if (isNativeToken(token)) {
      return await client.getBalance({ address: account })
    }
    // @ts-expect-error because it works on IDE
    return await getErc20TokenBalance(client, {
      account,
      address: token.address as `0x${string}`,
    })
  } catch {
    return BigInt(0)
  }
}
