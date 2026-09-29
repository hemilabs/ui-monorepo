import { queryOptions } from '@tanstack/react-query'
import { getEpochStreams } from 've-hemi-epoch-rewards/actions'
import { getAddress, type Address, type Chain, type Client } from 'viem'

export const getEpochStreamsQueryOptions = ({
  chainId,
  epoch,
  hemiClient,
  token,
}: {
  chainId: Chain['id']
  epoch: number
  hemiClient: Client
  token: Address
}) =>
  queryOptions({
    queryFn: () => getEpochStreams(hemiClient, { epoch, token }),
    queryKey: ['epochStreams', chainId, epoch, getAddress(token)],
    staleTime: 5 * 60 * 1000,
  })
