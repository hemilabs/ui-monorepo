import { useQuery } from '@tanstack/react-query'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'

export const useDepositShares = ({
  peggedAmount,
  shareAddress,
}: {
  peggedAmount: bigint | undefined
  shareAddress: Address
}) =>
  useQuery({
    enabled: peggedAmount !== undefined && peggedAmount > BigInt(0),
    queryFn: () =>
      convertToShares(getEvmL1PublicClient(mainnet.id), {
        address: getStakingVaultForShare(shareAddress),
        assets: peggedAmount!,
      }),
    queryKey: [
      'hemi-earn',
      'deposit-shares',
      shareAddress,
      peggedAmount?.toString(),
    ],
  })
