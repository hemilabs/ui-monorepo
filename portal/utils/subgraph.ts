import fetch from 'fetch-plus-plus'
import type { LockupMonths } from 'genesis-drop-actions'
import type { StakingPosition } from 'types/stakingDashboard'
import type {
  EvmDepositOperation,
  ToBtcWithdrawOperation,
  ToEvmWithdrawOperation,
} from 'types/tunnel'
import {
  encodeAbiParameters,
  type Hash,
  keccak256,
  parseAbiParameters,
  type TransactionReceipt,
  type Address,
  type Chain,
} from 'viem'
import { getWithdrawals } from 'viem/op-stack'

import { isL2NetworkId } from './chain'

const getSubgraphBaseUrl = (chainId: Chain['id']) =>
  `${process.env.NEXT_PUBLIC_PORTAL_API_URL}/subgraphs/${chainId}`

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
  return request<{
    withdrawals: (Omit<ToBtcWithdrawOperation, 'grossAmount'> & {
      netSatsAfterFee: string
    })[]
  }>(`${url}/withdrawals/${address}/btc`, {
    fromBlock,
    limit,
    skip,
  }).then(({ withdrawals }) =>
    // Map to add grossAmount field
    // grossAmount is the amount before fees deduction
    // amount is the net amount after fees deduction
    withdrawals.map(
      ({ amount: grossAmount, netSatsAfterFee: amount, ...rest }) => ({
        ...rest,
        amount,
        grossAmount,
      }),
    ),
  )
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
  // The same happens when claiming. As this hash is emitted in the Prove and Claim events, the subgraphs API allows us to filter by it.
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

/**
 * Retrieves BTC deposit information by transaction hash
 * @param params Parameters of the call.
 * @param params.chainId Hemi chain Id
 * @param params.depositTxId The Bitcoin transaction ID to search for
 * @returns The BTC deposit operation or null if not found
 */
export const getBtcDepositInfo = async function ({
  chainId,
  depositTxId,
}: {
  chainId: Chain['id']
  depositTxId: string
}) {
  const url = getSubgraphBaseUrl(chainId)

  return request<{ netSatsAfterFee: string; transactionHash: Hash } | null>(
    `${url}/deposits/${depositTxId}/btc`,
  ).catch(() => null)
}

/**
 * Raw staking position as returned by the subgraph API, with numeric fields
 * serialized as strings.
 */
type StakingPositionApiResult = Omit<
  StakingPosition,
  | 'amount'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'lockTime'
  | 'timestamp'
  | 'tokenId'
> & {
  amount: string
  blockNumber: string
  blockTimestamp: string
  lockTime: string
  timestamp: string
  tokenId: string
}

/**
 * Retrieves the staking (locked) positions for an address.
 * @param params Parameters of the call.
 * @param params.address The address of the position owner.
 * @param params.chainId Hemi chain Id.
 * @returns List of staking positions, or an empty list on failure.
 */
export const getLockedPositions = function ({
  address,
  chainId,
}: {
  address: Address
  chainId: Chain['id']
}) {
  const url = getSubgraphBaseUrl(chainId)

  return request<{ positions: StakingPositionApiResult[] }>(
    `${url}/locks/${address}`,
  )
    .then(({ positions }) =>
      positions.map(
        position =>
          ({
            ...position,
            amount: BigInt(position.amount),
            blockNumber: BigInt(position.blockNumber),
            blockTimestamp: BigInt(position.blockTimestamp),
            lockTime: BigInt(position.lockTime),
            timestamp: BigInt(position.timestamp),
            tokenId: BigInt(position.tokenId),
          }) as StakingPosition,
      ),
    )
    .catch(() => [] as StakingPosition[])
}

/**
 * Raw token claim transaction as returned by the subgraph API, with the amount
 * serialized as a string.
 */
export type ClaimTransaction = {
  account: Address
  amount: string
  lockupMonths: LockupMonths
  ratio: number
  transactionHash: Hash
}

export type ParsedClaimTransaction = Omit<ClaimTransaction, 'amount'> & {
  amount: bigint
}

/**
 * Retrieves the token claim transaction for an address and claim group.
 * @param params Parameters of the call.
 * @param params.address The address of the claimer.
 * @param params.chainId Hemi chain Id.
 * @param params.claimGroupId The id of the claim group to query.
 * @returns The claim transaction, or null if not found.
 */
export const getClaimTransaction = function ({
  address,
  chainId,
  claimGroupId,
}: {
  address: Address
  chainId: Chain['id']
  claimGroupId: number
}) {
  const url = getSubgraphBaseUrl(chainId)

  return request<ClaimTransaction>(`${url}/claim/${address}/${claimGroupId}`)
    .then(
      data =>
        ({
          account: data.account,
          amount: BigInt(data.amount),
          lockupMonths: data.lockupMonths,
          ratio: data.ratio,
          transactionHash: data.transactionHash,
        }) satisfies ParsedClaimTransaction,
    )
    .catch(() => null)
}
