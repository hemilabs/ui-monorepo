import {
  type CrossChainMessenger as CrossChainMessengerType,
  type SignerOrProviderLike,
} from '@eth-optimism/sdk'
import PQueue from 'p-queue'
import pThrottle from 'p-throttle'
import { type Address, type Chain, zeroAddress } from 'viem'

const sdkPromise = import('@eth-optimism/sdk')

// Read contracts from chain definition, but allow overriding them from .env variables.
// Useful when using a devnet or a short-lived fork of the chain.
export const getTunnelContracts = (l2Chain: Chain, l1ChainId: Chain['id']) => ({
  AddressManager: (process.env.NEXT_PUBLIC_ADDRESS_MANAGER ??
    l2Chain.contracts.addressManager[l1ChainId].address) as Address,
  BondManager: zeroAddress,
  CanonicalTransactionChain: zeroAddress,
  L1CrossDomainMessenger: (process.env
    .NEXT_PUBLIC_PROXY_OVM_L1_CROSS_DOMAIN_MESSENGER ??
    l2Chain.contracts.l1CrossDomainMessenger[l1ChainId].address) as Address,
  L1StandardBridge: (process.env.NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE ??
    l2Chain.contracts.l1StandardBridge[l1ChainId].address) as Address,
  L2Bridge: (process.env.NEXT_PUBLIC_L2_BRIDGE ??
    l2Chain.contracts.l2Bridge[l1ChainId].address) as Address,
  L2OutputOracle: (process.env.NEXT_PUBLIC_L2_OUTPUT_ORACLE_PROXY ??
    l2Chain.contracts.l2OutputOracle[l1ChainId].address) as Address,
  OptimismPortal: (process.env.NEXT_PUBLIC_OPTIMISM_PORTAL_PROXY ??
    l2Chain.contracts.portal[l1ChainId].address) as Address,
  StateCommitmentChain: zeroAddress,
})

type CrossChainMessengerParameters = {
  l1ChainId: Chain['id']
  l1Signer: SignerOrProviderLike
  l2Chain: Chain
  l2Signer: SignerOrProviderLike
}

export async function createIsolatedCrossChainMessenger({
  l1ChainId,
  l1Signer,
  l2Chain,
  l2Signer,
}: CrossChainMessengerParameters) {
  const { CrossChainMessenger, ETHBridgeAdapter, StandardBridgeAdapter } =
    await sdkPromise

  const l1Contracts = getTunnelContracts(l2Chain, l1ChainId)
  return new CrossChainMessenger({
    bedrock: true,
    bridges: {
      ETH: {
        Adapter: ETHBridgeAdapter,
        l1Bridge: l1Contracts.L1StandardBridge,
        l2Bridge: l1Contracts.L2Bridge,
      },
      Standard: {
        Adapter: StandardBridgeAdapter,
        l1Bridge: l1Contracts.L1StandardBridge,
        l2Bridge: l1Contracts.L2Bridge,
      },
    },
    contracts: {
      l1: l1Contracts,
    },
    l1ChainId,
    l1SignerOrProvider: l1Signer,
    l2ChainId: l2Chain.id,
    l2SignerOrProvider: l2Signer,
  })
}

const properties = ['estimateGas'] as const

const throttledMethods = [
  'depositERC20',
  'depositETH',
  'finalizeMessage',
  'getDepositsByAddress',
  'getMessageReceipt',
  'getWithdrawalsByAddress',
  'getMessageStatus',
  'proveMessage',
  'withdrawERC20',
  'withdrawETH',
] as const

export type CrossChainMessengerProxy = Pick<
  CrossChainMessengerType,
  (typeof throttledMethods)[number] | (typeof properties)[number]
>

// Run up to ${concurrency} async methods (which internally may have many calls) at the same time
const queue = new PQueue({ concurrency: 2 })
// and use throttling as some methods may run very fast and many quick calls may hit
// rate limiting
const throttle = pThrottle({ interval: 5000, limit: 2, strict: true })

// This function creates a CrossChainMessenger and wraps its methods with a throttle
// shared with all of its methods. Additionally, all instances created with it
// share the same queue and throttling instance.
export const createQueuedCrossChainMessenger = async function (
  parameters: CrossChainMessengerParameters,
): Promise<CrossChainMessengerProxy> {
  const crossChainMessenger =
    await createIsolatedCrossChainMessenger(parameters)

  // Can't use a proxy because it doesn't work well with Promises
  // See https://medium.com/@davidcallanan/a-peculiar-promises-and-proxy-bug-that-cost-me-5-hours-javascript-3a11e1fcd713
  // although the solution in that post doesn't work for me, it explains the problems I had.
  // I can't use Object.keys either, because some of the functions that we need
  // are hidden behind the Prototype!. So the best option (at least with the time I wanted to spend in this problem)
  // is to list them manually.
  // With the definition of CrossChainMessengerProxy, we get at least type-safety
  // if we try to use a method that wasn't listed.
  return Object.fromEntries(
    throttledMethods
      .map(method => [
        method,
        throttle((...args) =>
          queue.add(() =>
            crossChainMessenger[method].bind(crossChainMessenger)(...args),
          ),
        ),
      ])
      .concat(
        // @ts-expect-error it infers the type of the array above (which are functions)
        // so properties get rejected. This is expected due to native TS inference for array methods
        properties.map(property => [property, crossChainMessenger[property]]),
      ),
  )
}
