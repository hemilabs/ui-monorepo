// This strategy is used to cache some of the requests done by the OP sdk
// when fetching data for withdrawals
import { Hash, keccak256, toHex } from 'viem'

type RpcCallParam = {
  data: Hash
  to: Hash
}

const getSignature = (method: string) => keccak256(toHex(method)).slice(0, 10)

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
    // only eth_call reaches this point
    const { data } = params[0] as RpcCallParam
    return cacheIndexedData[data.slice(0, 10)]
  },
}
