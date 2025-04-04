import { type Address, type Client, erc20Abi, isAddress } from 'viem'
import { readContract } from 'viem/actions'

export const getErc20TokenBalance = async function (
  client: Client,
  parameters: { account: Address; address: Address },
) {
  const { account, address } = parameters ?? {}

  if (!isAddress(account)) {
    throw new Error('Invalid account')
  }
  if (!isAddress(address)) {
    throw new Error('Invalid owner address')
  }

  return readContract(client, {
    abi: erc20Abi,
    address,
    args: [account],
    functionName: 'balanceOf',
  })
}
