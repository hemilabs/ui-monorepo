import {
  type CrossChainMessenger as CrossChainMessengerType,
  type SignerOrProviderLike,
} from '@eth-optimism/sdk'
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

type ThrottledMethods =
  | 'depositERC20'
  | 'depositETH'
  | 'finalizeMessage'
  | 'getDepositsByAddress'
  | 'getMessageReceipt'
  | 'getWithdrawalsByAddress'
  | 'getMessageStatus'
  | 'proveMessage'
  | 'withdrawERC20'
  | 'withdrawETH'
  | 'estimateGas'

export type CrossChainMessengerProxy = Pick<
  CrossChainMessengerType,
  ThrottledMethods
>
