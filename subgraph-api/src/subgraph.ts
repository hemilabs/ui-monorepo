// Copied from https://github.com/hemilabs/ui-monorepo/blob/853f366d/webapp/utils/subgraph.ts
// and extended from there.

import config from 'config'
import fetch from 'fetch-plus-plus'
import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address, type Chain, checksumAddress as toChecksum } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

import {
  type EvmDepositOperation,
  type ToBtcWithdrawOperation,
  type ToEvmWithdrawOperation,
} from '../types/tunnel.ts'

type Schema = {
  query: string
  variables?: Record<string, string | number>
}

type SuccessResponse<T> = { data: T }
type ErrorResponse = { errors: { message: string }[] }
type GraphResponse<T> = SuccessResponse<T> | ErrorResponse

type ConfigType = typeof import('../config/default.json')

const subgraphConfig: ConfigType['subgraph'] = config.get('subgraph')

const getSubgraphUrl = function ({
  chainId,
  subgraphIds,
}: {
  chainId: Chain['id']
  subgraphIds: Record<Chain['id'], string>
}) {
  const subgraphId = subgraphIds[chainId]
  if (!subgraphId) {
    throw new Error(`Unsupported subgraph for chain Id ${chainId}`)
  }

  return `${subgraphConfig.apiUrl}/${subgraphConfig.apiKey}/subgraphs/id/${subgraphId}`
}

const request = <TResponse, TSchema extends Schema = Schema>(
  url: string,
  schema: TSchema,
): Promise<TResponse> =>
  fetch(url, {
    body: JSON.stringify(schema),
    headers: {
      'Content-Type': 'application/json',
      'Origin': subgraphConfig.origin,
    },
    method: 'POST',
  }) satisfies Promise<TResponse>

const getTunnelSubgraphUrl = function (chainId: Chain['id']) {
  /**
   * Subgraph Ids from the subgraphs published in Arbitrum
   */
  const subgraphIds = {
    [hemi.id]: subgraphConfig.tunnel.withdrawals.mainnet,
    [hemiSepolia.id]: subgraphConfig.tunnel.withdrawals.testnet,
    [mainnet.id]: subgraphConfig.tunnel.deposits.mainnet,
    [sepolia.id]: subgraphConfig.tunnel.deposits.testnet,
  }

  return getSubgraphUrl({
    chainId,
    subgraphIds,
  })
}

/**
 * Helper function to check for errors in GraphQL responses
 * @param response The GraphQL response to check
 * @throws Error if the response contains errors
 */
function checkGraphQLErrors<T>(
  response: GraphResponse<T>,
): asserts response is SuccessResponse<T> {
  // Check if response has errors
  if ('errors' in response && response.errors.length > 0) {
    // Extract error messages and join them
    const errorMessages = response.errors.map(e => e.message).join(', ')
    throw new Error(`GraphQL Error: ${errorMessages}`)
  }
}

/**
 * Retrieves the Last indexed block by the subgraph for the given chain.
 * @param chainId Id of the chain whose subgraph is going to be queried.
 * @returns A Promise that resolves into the last indexed block.
 */
export const getLastIndexedBlock = function (chainId: Chain['id']) {
  const url = getTunnelSubgraphUrl(chainId)
  const schema = {
    query: `{
      _meta {
        block {
          number
        }
      }
    }`,
  }
  return request<GraphResponse<{ _meta: { block: { number: number } } }>>(
    url,
    schema,
  ).then(function (response) {
    checkGraphQLErrors(response)
    return response.data._meta.block.number
  })
}

type GetBtcWithdrawalsQueryResponse = GraphResponse<{
  btcWithdrawals: (Omit<
    ToBtcWithdrawOperation,
    'blockNumber' | 'timestamp' | 'to'
  > & {
    blockNumber: string
    timestamp: string
    // Due to a bug in the subgraph parsing tx's inputs, some withdrawals
    // may not have the "to" field set.
    to: string | null
  })[]
}>

/**
 * Retrieves a list of Withdrawals from Hemi to Bitcoin
 * @param params Parameters of the call.
 * @param params.address The address of the withdrawer.
 * @param params.chainId Hemi chainId.
 * @param params.fromBlock Number of block from which withdrawals (up to the most recent block) should be returned.
 * @param params.limit Max amount of withdrawals to return per call.
 * @param params.orderBy Field to order the withdrawals.
 * @param params.orderDirection Direction to sort the withdrawals.
 * @param params.skip Amount of withdrawals to skip when querying.
 * @returns List of Bitcoin withdrawals
 */
export const getBtcWithdrawals = function ({
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
  const url = getTunnelSubgraphUrl(chainId)
  // By default, graphql is capped to 100 elements. See https://github.com/directus/directus/issues/3667#issuecomment-758854070
  // Bring everything - either way, for most cases, the blockNumber will filter and only a few handful withdrawals will be brought
  const schema = {
    query: `query GetBtcWithdrawals ($address: String!, $fromBlock: BigInt!, $limit: Int!, $orderBy: String!, $orderDirection: String!, $skip: Int!) {
      btcWithdrawals(first: $limit, orderBy: $orderBy, orderDirection: $orderDirection, skip: $skip, where: { from: $address, blockNumber_gte: $fromBlock }) {
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
        transactionHash,
        uuid
      }
    }`,
    variables: { address, fromBlock, limit, orderBy, orderDirection, skip },
  }

  return request<GetBtcWithdrawalsQueryResponse>(url, schema).then(
    function (response) {
      checkGraphQLErrors(response)
      return response.data.btcWithdrawals.map(d => ({
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
      }))
    },
  ) satisfies Promise<ToBtcWithdrawOperation[]>
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
  const url = getTunnelSubgraphUrl(chainId)
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

  return request<GetEvmDepositsQueryResponse>(url, schema).then(
    function (response) {
      checkGraphQLErrors(response)
      return response.data.deposits.map(d => ({
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
      }))
    },
  ) satisfies Promise<EvmDepositOperation[]>
}

type GetEvmWithdrawalsQueryResponse = GraphResponse<{
  evmWithdrawals: (Omit<ToEvmWithdrawOperation, 'blockNumber' | 'timestamp'> & {
    blockNumber: string
    timestamp: string
  })[]
}>

/**
 * Retrieves a list of Withdrawals from Hemi into an EVM compatible chain
 * @param params Parameters of the call.
 * @param params.address The address of the withdrawer.
 * @param params.chainId Hemi chain Id
 * @param params.fromBlock Number of block from which withdrawal (up to the most recent block) should be returned.
 * @param params.limit Max amount of withdrawals to return per call.
 * @param params.orderBy Field to order the withdrawals.
 * @param params.orderDirection Direction to sort the withdrawals.
 * @param params.skip Amount of withdrawals to skip when querying.
 * @returns List of withdrawals
 */
export const getEvmWithdrawals = function ({
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
  const url = getTunnelSubgraphUrl(chainId)
  // By default, graphql is capped to 100 elements. See https://github.com/directus/directus/issues/3667#issuecomment-758854070
  // Bring everything - either way, for most cases, the blockNumber will filter and only a few handful deposits will be brought
  const schema = {
    query: `query GetEvmWithdrawals ($address: String!, $fromBlock: BigInt!, $limit: Int!, $orderBy: String!, $orderDirection: String!, $skip: Int!) {
      evmWithdrawals(first: $limit, orderBy: $orderBy, orderDirection: $orderDirection, skip: $skip, where: { from: $address, blockNumber_gte: $fromBlock }) {
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

  return request<GetEvmWithdrawalsQueryResponse>(url, schema).then(
    function (response) {
      checkGraphQLErrors(response)
      return response.data.evmWithdrawals.map(d => ({
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
      }))
    },
  )
}

type GetTotalStakedBalancesQueryResponse = GraphResponse<{
  tokenStakeBalances: {
    id: Address
    totalStaked: string
  }[]
}>

export const getTotalStaked = function (hemiId: Chain['id']) {
  /**
   * Subgraph Ids from the subgraphs published in Arbitrum
   */
  const subgraphIds = {
    [hemi.id]: subgraphConfig.stake.mainnet,
    [hemiSepolia.id]: subgraphConfig.stake.testnet,
  }

  const subgraphUrl = getSubgraphUrl({
    chainId: hemiId,
    subgraphIds,
  })

  const schema = {
    query: `{
      tokenStakeBalances {
        id,
        totalStaked
      }
    }`,
  }

  return request<GetTotalStakedBalancesQueryResponse>(subgraphUrl, schema).then(
    function (response) {
      checkGraphQLErrors(response)
      return response.data.tokenStakeBalances.map(({ id, ...rest }) => ({
        ...rest,
        // By default, The Graph store addresses as lowercase
        id: toChecksum(id),
      }))
    },
  )
}

type GetWithdrawalProofAndClaimQueryResponse = GraphResponse<{
  withdrawal: {
    id: string
    claimTxHash: string | null
    proveTxHash: string | null
  } | null
}>

export const getWithdrawalProofAndClaim = function ({
  chainId,
  hashedWithdrawal,
}: {
  chainId: Chain['id']
  hashedWithdrawal: string
}) {
  /**
   * Subgraph Ids from the subgraphs published in Arbitrum
   */
  const subgraphIds = {
    [mainnet.id]: subgraphConfig.tunnel.withdrawalProofs.mainnet,
    [sepolia.id]: subgraphConfig.tunnel.withdrawalProofs.testnet,
  }

  const subgraphUrl = getSubgraphUrl({
    chainId,
    subgraphIds,
  })

  const schema = {
    query: `query GetWithdrawal($hashedWithdrawal: String!) {
      withdrawal(id: $hashedWithdrawal) {
        id
        claimTxHash
        proveTxHash
      }
    }`,
    variables: { hashedWithdrawal },
  }

  return request<GetWithdrawalProofAndClaimQueryResponse>(
    subgraphUrl,
    schema,
  ).then(function (response) {
    checkGraphQLErrors(response)
    return response.data.withdrawal
  })
}
