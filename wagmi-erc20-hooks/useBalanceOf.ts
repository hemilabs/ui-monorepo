import { Chain, type Address, type ContractFunctionArgs } from 'viem'
import { type UseReadContractParameters } from 'wagmi'

import { useReadErc20, Erc20Abi } from './baseErc20'

type Account = ContractFunctionArgs<Erc20Abi, 'view', 'balanceOf'>[0]

type Options = {
  args: { account: Account; chainId: Chain['id'] }
  query?: UseReadContractParameters<Erc20Abi, 'balanceOf'>['query']
}

export const useBalanceOf = (
  erc20Address: Address,
  { args: { account, chainId }, query }: Options,
) =>
  useReadErc20({
    address: erc20Address,
    args: [account],
    chainId,
    functionName: 'balanceOf',
    query,
  })
