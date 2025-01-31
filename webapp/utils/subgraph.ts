import fetch from 'fetch-plus-plus'
import { EvmDepositOperation } from 'types/tunnel'
import { type Address, type Chain, checksumAddress as toChecksum } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

const subgraphUrls = {
  [mainnet.id]: process.env.NEXT_PUBLIC_SUBGRAPH_MAINNET_URL,
  [sepolia.id]: process.env.NEXT_PUBLIC_SUBGRAPH_SEPOLIA_URL,
}

type GraphResponse<T> = { data: T }

const getGraphUrl = function (chainId: Chain['id']) {
  const url = subgraphUrls[chainId]
  if (!url) {
    throw new Error(`Unsupported subgraph for chain Id ${chainId}`)
  }
  return url
}

/**
 * Retrieves the Last indexed block by the subgraph for the given chain.
 * @param chainId Id of the chain whose subgraph is going to be queried.
 * @returns A Promise that resolves into the last indexed block.
 */
export const getLastIndexedBlock = function (chainId: Chain['id']) {
  const url = getGraphUrl(chainId)
  const schema = {
    query: `{
      _meta {
        block {
          number
        }
      }
    }`,
  }
  return fetch(url, {
    body: JSON.stringify(schema),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then(
    (r: GraphResponse<{ _meta: { block: { number: number } } }>) =>
      r.data._meta.block.number,
  )
}

type GetEvmDepositsQueryResponse = GraphResponse<{
  deposits: (Omit<EvmDepositOperation, 'blockNumber' | 'timestamp'> & {
    blockNumber: string
    timestamp: string
  })[]
}>

/**
 * Retrieves a list of Deposits from an EVM compatible chain into Hemi.
 * @param params Parameters of the call.
 * @param params.address The address of the depositor.
 * @param params.chainId ChainId of the source chain.
 * @param params.fromBlock Number of block from which deposits (up to the most recent block) should be returned.
 * @param params.limit Max amount of deposits to return per call.
 * @param params.orderBy Field to order the deposits.
 * @param params.orderDirection Direction to sort the deposits.
 * @param params.skip Amount of deposits to skip when querying.
 * @returns List of deposits
 */
export const getEvmDeposits = function ({
  address,
  chainId,
  fromBlock,
  limit = 100,
  orderBy = 'timestamp',
  orderDirection = 'asc',
  skip = 0,
}: {
  address: Address
  chainId: Chain['id']
  fromBlock: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  skip?: number
}) {
  const url = getGraphUrl(chainId)
  // By default, graphql is capped to 100 elements. See https://github.com/directus/directus/issues/3667#issuecomment-758854070
  // Bring everything - either way, for most cases, the blockNumber will filter and only a few handful deposits will be brought
  const schema = {
    query: `query GetEvmDeposits ($address: String!, $fromBlock: BigInt!, $limit: Int!, $orderBy: String!, $orderDirection: String!, $skip: Int!) {
      deposits(first: $limit, orderBy: $orderBy, orderDirection: $orderDirection, skip: $skip, where: { from: $address, blockNumber_gte: $fromBlock }) {
        amount,
        blockNumber,
        direction,
        from,
        l1ChainId,
        l1Token,
        l2ChainId,
        l2Token,
        timestamp,
        to,
        transactionHash
      }
    }`,
    variables: { address, fromBlock, limit, orderBy, orderDirection, skip },
  }

  return fetch(url, {
    body: JSON.stringify(schema),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then(({ data }: GetEvmDepositsQueryResponse) =>
    data.deposits.map(d => ({
      // The Subgraph lowercases all the addresses when saving, so better convert them
      // into checksum format to avoid errors when trying to get balances or other operations.
      // GraphQL also converts BigInt as strings
      ...d,
      blockNumber: Number(d.blockNumber),
      // @ts-expect-error OP-SDK does not properly type addresses as Address
      from: toChecksum(d.from),
      // @ts-expect-error OP-SDK does not properly type addresses as Address
      l1Token: toChecksum(d.l1Token),
      // @ts-expect-error OP-SDK does not properly type addresses as Address
      l2Token: toChecksum(d.l2Token),
      timestamp: Number(d.timestamp),
      // @ts-expect-error OP-SDK does not properly type addresses as Address
      to: toChecksum(d.to),
    })),
  ) satisfies Promise<EvmDepositOperation[]>
}
