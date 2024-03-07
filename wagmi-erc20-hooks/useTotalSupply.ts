import { type Address } from 'viem'
import { type UseReadContractParameters } from 'wagmi'

import { useReadErc20, Erc20Abi } from './baseErc20'

type Options = {
  query?: UseReadContractParameters<Erc20Abi, 'totalSupply'>['query']
}

export const useTotalSupply = (erc20Address: Address, { query }: Options) =>
  useReadErc20({
    address: erc20Address,
    functionName: 'totalSupply',
    query,
  })
