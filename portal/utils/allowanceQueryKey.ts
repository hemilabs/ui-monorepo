import { allowanceQueryKey } from '@hemilabs/react-hooks/useAllowance'
import { type Address, type Chain, isAddress, zeroAddress } from 'viem'

export const normalizeTokenAddressForAllowance = (
  tokenAddress: string,
): Address => (isAddress(tokenAddress) ? tokenAddress : zeroAddress)

export const buildAllowanceQueryKey = ({
  chainId,
  owner,
  spender,
  tokenAddress,
}: {
  chainId: Chain['id']
  owner: Address | undefined
  spender: Address | undefined
  tokenAddress: string
}) =>
  allowanceQueryKey({
    owner,
    spender,
    token: {
      address: normalizeTokenAddressForAllowance(tokenAddress),
      chainId,
    },
  })
