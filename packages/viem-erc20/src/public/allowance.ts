import { type Address, type Client, erc20Abi, isAddress } from 'viem'
import { readContract } from 'viem/actions'

export const getErc20TokenAllowance = async function (
  client: Client,
  parameters: { address: Address; owner: Address; spender: Address },
) {
  const { address, owner, spender } = parameters ?? {}

  if (!isAddress(address)) {
    throw new Error('Invalid address')
  }
  if (!isAddress(owner)) {
    throw new Error('Invalid owner address')
  }
  if (!isAddress(spender)) {
    throw new Error('Invalid spender address')
  }

  return readContract(client, {
    abi: erc20Abi,
    address,
    args: [owner, spender],
    functionName: 'allowance',
  })
}
