import fetch from 'fetch-plus-plus'
import {
  EvmDepositOperation,
  ToBtcWithdrawOperation,
  ToEvmWithdrawOperation,
} from 'types/tunnel'
import {
  encodeAbiParameters,
  Hash,
  keccak256,
  parseAbiParameters,
  TransactionReceipt,
  type Address,
  type Chain,
} from 'viem'
import { getWithdrawals } from 'viem/op-stack'

import { isL2NetworkId } from './chain'

const getSubgraphBaseUrl = (chainId: Chain['id']) =>
  `${process.env.NEXT_PUBLIC_SUBGRAPHS_API_URL}/${chainId}`

const request = <TResponse>(
  url: string,
  queryString?: { fromBlock?: number; limit?: number; skip?: number },
): Promise<TResponse> =>
  fetch(url, {
    method: 'GET',
    queryString,
  }) satisfies Promise<TResponse>

/**
 * Retrieves the Last indexed block by the subgraph for the given chain.
 * @param chainId Id of the chain whose subgraph is going to be queried.
 * @returns A Promise that resolves into the last indexed block.
 */
export const getLastIndexedBlock = function (chainId: Chain['id']) {
  const url = getSubgraphBaseUrl(chainId)
  return request<{ number: number }>(
    `${url}/${isL2NetworkId(chainId) ? 'withdrawals' : 'deposits'}/meta`,
  ).then(({ number }) => number)
}

/**
 * Retrieves a list of Withdrawals from Hemi to Bitcoin
 * @param params Parameters of the call.
 * @param params.address The address of the withdrawer.
 * @param params.chainId Hemi chainId.
 * @param params.fromBlock Number of block from which withdrawals (up to the most recent block) should be returned.
 * @param params.limit Max amount of withdrawals to return per call.
 * @param params.skip Amount of withdrawals to skip when querying.
 * @returns List of Bitcoin withdrawals
 */
export const getBtcWithdrawals = function ({
  address,
  chainId,
  fromBlock,
  limit = 100,
  skip = 0,
}: {
  address: Address
  chainId: Chain['id']
  fromBlock: number
  limit?: number
  skip?: number
}) {
  const url = getSubgraphBaseUrl(chainId)
  return request<{ withdrawals: ToBtcWithdrawOperation[] }>(
    `${url}/withdrawals/${address}/btc`,
    {
      fromBlock,
      limit,
      skip,
    },
  ).then(({ withdrawals }) => withdrawals)
}

/**
 * Retrieves a list of Deposits from an EVM compatible chain into Hemi.
 * @param params Parameters of the call.
 * @param params.address The address of the depositor.
 * @param params.chainId ChainId of the source chain.
 * @param params.fromBlock Number of block from which deposits (up to the most recent block) should be returned.
 * @param params.limit Max amount of deposits to return per call.
 * @param params.skip Amount of deposits to skip when querying.
 * @returns List of deposits
 */
export const getEvmDeposits = function ({
  address,
  chainId,
  fromBlock,
  limit = 100,
  skip = 0,
}: {
  address: Address
  chainId: Chain['id']
  fromBlock: number
  limit?: number
  skip?: number
}) {
  const url = getSubgraphBaseUrl(chainId)
  return request<{ deposits: EvmDepositOperation[] }>(
    `${url}/deposits/${address}`,
    {
      fromBlock,
      limit,
      skip,
    },
  ).then(({ deposits }) => deposits)
}

/**
 * Retrieves a list of Withdrawals from Hemi into an EVM compatible chain
 * @param params Parameters of the call.
 * @param params.address The address of the withdrawer.
 * @param params.chainId Hemi chain Id
 * @param params.fromBlock Number of block from which withdrawal (up to the most recent block) should be returned.
 * @param params.limit Max amount of withdrawals to return per call.
 * @param params.skip Amount of withdrawals to skip when querying.
 * @returns List of withdrawals
 */
export const getEvmWithdrawals = function ({
  address,
  chainId,
  fromBlock,
  limit = 100,
  skip = 0,
}: {
  address: Address
  chainId: Chain['id']
  fromBlock: number
  limit?: number
  skip?: number
}) {
  const url = getSubgraphBaseUrl(chainId)
  return request<{ withdrawals: ToEvmWithdrawOperation[] }>(
    `${url}/withdrawals/${address}/evm`,
    {
      fromBlock,
      limit,
      skip,
    },
  ).then(({ withdrawals }) => withdrawals)
}

export const getTotalStaked = function (hemiId: Chain['id']) {
  const url = getSubgraphBaseUrl(hemiId)

  return request<{
    staked: {
      id: Address
      totalStaked: string
    }[]
  }>(`${url}/staked`).then(({ staked }) => staked)
}

export const getWithdrawalProofClaimTxs = function (
  withdrawalReceipt: TransactionReceipt,
  l1ChainId: Chain['id'],
) {
  // When proving (and claiming) withdrawals, the storageKey where the proof will be saved
  // in the contract is based on hashing a withdrawal object. See this hashing in
  // https://github.com/hemilabs/optimism/blob/bde08fd3e335c235455b4cee6a6f8dbf88446201/packages/contracts-bedrock/src/L1/OptimismPortal2.sol#L542
  // The same happens when claiming. As this hash is emitted in the Prove and Claim events, the subgraph-api allows us to filter by it.
  // Because of that, we need to regenerate the hash to be able to query the events indexed.
  // The code below is an implementation based of
  // https://github.com/hemilabs/optimism/blob/bde08fd3e335c235455b4cee6a6f8dbf88446201/packages/contracts-bedrock/src/libraries/Hashing.sol#L107
  // which generates the same hash
  const hashWithdrawal = function () {
    const [{ data, gasLimit, nonce, sender, target, value }] =
      getWithdrawals(withdrawalReceipt)

    const encoded = encodeAbiParameters(
      parseAbiParameters('uint256, address, address, uint256, uint256, bytes'),
      [nonce, sender, target, value, gasLimit, data],
    )

    return keccak256(encoded)
  }

  const url = getSubgraphBaseUrl(l1ChainId)

  return request<{
    claimTxHash: Hash | null
    id: string
    proveTxHash: Hash | null
  }>(`${url}/hashedWithdrawals/${hashWithdrawal()}`)
}
