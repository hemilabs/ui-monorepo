import { type Address, type Client, erc20Abi, isAddress } from 'viem'
import { writeContract } from 'viem/actions'

export const approveErc20Token = async function (
  client: Client,
  parameters: {
    address: Address
    amount: bigint
    spender: Address
  },
) {
  const { address, amount, spender } = parameters
  if (!isAddress(address)) {
    throw new Error('Invalid address')
  }
  if (typeof amount !== 'bigint') {
    throw new Error('Invalid amount')
  }
  if (!isAddress(spender)) {
    throw new Error('Invalid spender address')
  }
  if (amount <= BigInt(0)) {
    throw new Error('Invalid amount, must be greater than 0')
  }

  return writeContract(client, {
    abi: erc20Abi,
    // @ts-expect-error: TS is complaining about client.account definition, but this works
    account: client.account,
    address,
    args: [spender, amount] as const,
    // @ts-expect-error: TS is complaining about client.chain definition, but this works
    chain: client.chain,
    functionName: 'approve',
  })
}
