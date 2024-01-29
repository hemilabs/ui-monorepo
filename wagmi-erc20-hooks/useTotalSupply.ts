import { Address } from 'viem'

import { useReadErc20, type QueryOptions } from './baseErc20'

export const useTotalSupply = (
  erc20Address: Address,
  { query }: { query?: QueryOptions<bigint> } = {},
) => useReadErc20(erc20Address, 'allowance', undefined, query)
