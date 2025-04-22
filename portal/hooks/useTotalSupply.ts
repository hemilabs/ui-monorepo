import { Token } from 'types/token'
import { type Address, type Chain, erc20Abi } from 'viem'
import { useReadContract } from 'wagmi'

export const useTotalSupply = (
  address: Token['address'],
  chainId?: Chain['id'],
) =>
  useReadContract({
    abi: erc20Abi,
    address: address as Address,
    args: [],
    chainId,
    functionName: 'totalSupply',
  })
