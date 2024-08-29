// This strategy is used to cache some of the requests done by the OP sdk
// when fetching data for withdrawals
import { Hash, keccak256, isHash } from 'viem'

type RpcCallParam = {
  data: Hash
  to: Hash
}

const isWithdrawalEthCall = function (obj: unknown): obj is RpcCallParam {
  const casted = obj as RpcCallParam
  return casted !== undefined && isHash(casted.data)
}

const getSignature = (method: string) =>
  keccak256(Buffer.from(method)).slice(0, 10)

const cachePerMethod = [
  {
    method: 'successfulMessages(bytes32)',
    strategy: 'block',
  },
  {
    method: 'failedMessages(bytes32)',
    strategy: 'block',
  },
  {
    method: 'version()',
    strategy: 'permanent',
  },
  {
    method: 'getL2OutputIndexAfter(uint256)',
    strategy: 'block',
  },
  {
    method: 'getL2Output(uint256)',
    strategy: 'block',
  },
  {
    method: 'provenWithdrawals(bytes32)',
    strategy: 'block',
  },
]

const cacheIndexedData: Record<string, string> = cachePerMethod.reduce(
  (acc, { method, strategy }) => ({
    ...acc,
    [getSignature(method)]: strategy,
  }),
  {},
)

export const withdrawalsStrategy = {
  methods: ['eth_call'],
  name: 'withdrawals-strategy',
  resolver(_: string, params: unknown[]) {
    if (!isWithdrawalEthCall(params[0])) {
      // doesn't have the structure of eth_call - do not use cache
      return undefined
    }
    const { data } = params[0]
    return cacheIndexedData[data.slice(0, 10)]
  },
}
