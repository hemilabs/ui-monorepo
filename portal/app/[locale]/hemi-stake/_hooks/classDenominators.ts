import { queryOptions } from '@tanstack/react-query'
import { getClassDenominators } from 've-hemi-epoch-rewards/actions'
import { type Chain, type Client } from 'viem'

export const getClassDenominatorsQueryKeyPrefix = ({
  chainId,
}: {
  chainId: Chain['id']
}) => ['classDenominators', chainId]

export const getClassDenominatorsQueryOptions = ({
  chainId,
  epoch,
  hemiClient,
}: {
  chainId: Chain['id']
  epoch: number
  hemiClient: Client
}) =>
  queryOptions({
    queryFn: () => getClassDenominators(hemiClient, { epoch }),
    queryKey: [...getClassDenominatorsQueryKeyPrefix({ chainId }), epoch],
    staleTime: 5 * 60 * 1000,
  })
