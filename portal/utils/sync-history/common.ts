import { TunnelOperation } from 'types/tunnel'

export const calculateSkip = function ({
  limit,
  skip,
  operations,
}: {
  limit: number
  skip: number
  operations: Pick<TunnelOperation, 'blockNumber'>[]
}) {
  // it turns out that GraphQL does not allow $skip larger than 5000
  // if we hit that limit, we better use a different "fromBlock"
  if (skip <= 4900) {
    return { skip: skip + limit }
  }
  // if we hit the limit, we need to increase the fromBlock. So grab the last one known as valid
  // and reset the "skip" to 0
  return {
    fromBlock: operations.at(-1).blockNumber ?? 0,
    skip: 0,
  }
}
