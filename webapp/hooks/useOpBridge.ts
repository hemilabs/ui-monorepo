import { type CrossChainMessenger as CrossChainMessengerType } from '@eth-optimism/sdk'
import { bvm } from 'app/networks'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { type Chain, useAccount, useMutation, useQuery } from 'wagmi'

import { useEstimateFees } from './useEstimateFees'

const sdkPromise = import('@eth-optimism/sdk')

// Overestimation for L1 gas limit used by OP/SDK
// See https://github.com/ethereum-optimism/optimism/blob/592daa704a56f5b3df21b41ea7cc294ab63b95ff/packages/sdk/src/cross-chain-messenger.ts#L2060
const defaultOverEstimation = 1.5
const zeroAddr = '0x'.padEnd(42, '0')
const l1Contracts = {
  AddressManager: process.env.NEXT_PUBLIC_ADDRESS_MANAGER,
  BondManager: zeroAddr,
  CanonicalTransactionChain: zeroAddr,
  L1CrossDomainMessenger:
    process.env.NEXT_PUBLIC_PROXY_OVM_L1_CROSS_DOMAIN_MESSENGER,
  L1StandardBridge: process.env.NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE,
  L2OutputOracle: process.env.NEXT_PUBLIC_L2_OUTPUT_ORACLE_PROXY,
  OptimismPortal: process.env.NEXT_PUBLIC_OPTIMISM_PORTAL_PROXY,
  StateCommitmentChain: zeroAddr,
}

const useCrossChainMessenger = function (
  l1ChainId: Chain['id'],
  expectedChainId: Chain['id'],
) {
  const { isConnected } = useAccount()
  const isConnectedToL2 = useIsConnectedToExpectedNetwork(expectedChainId)

  const l1Signer = useEthersSigner(l1ChainId)
  const l2Signer = useEthersSigner(bvm.id)

  const queryKey = [l1ChainId, bvm.id]

  // This Hook creates the dynamically loaded instance of the sdk's CrossChainMessenger
  // We can't use useMemo because it only works for synchronous code
  // Other options are using context, useQuery or a useRef to keep a single instance.
  // However, the instance depends on the address and chain connected, which makes it complex
  // to handle in React's context (it will require useEffect for different scenarios).
  const { data: crossChainMessenger, status: crossChainMessengerStatus } =
    useQuery(
      queryKey,
      async function getCrossChainMessenger() {
        const { CrossChainMessenger, ETHBridgeAdapter, StandardBridgeAdapter } =
          await sdkPromise
        return new CrossChainMessenger({
          bedrock: true,
          bridges: {
            ETH: {
              Adapter: ETHBridgeAdapter,
              l1Bridge: l1Contracts.L1StandardBridge,
              l2Bridge: process.env.NEXT_PUBLIC_L2_BRIDGE,
            },
            Standard: {
              Adapter: StandardBridgeAdapter,
              l1Bridge: l1Contracts.L1StandardBridge,
              l2Bridge: process.env.NEXT_PUBLIC_L2_BRIDGE,
            },
          },
          contracts: {
            l1: l1Contracts,
          },
          l1ChainId,
          l1SignerOrProvider: l1Signer,
          l2ChainId: bvm.id,
          l2SignerOrProvider: l2Signer,
        })
      },
      {
        enabled: isConnected && isConnectedToL2 && !!l1Signer && !!l2Signer,
      },
    )

  return {
    crossChainMessenger,
    crossChainMessengerStatus,
  }
}

type UseEstimateGasFees = {
  amount: string
  expectedChainConnected: Chain['id']
  l1ChainId: Chain['id']
  operation: Extract<
    keyof CrossChainMessengerType['estimateGas'],
    'depositETH' | 'withdrawETH'
  >
  overEstimation: number
}
const useEstimateGasFees = function ({
  amount,
  expectedChainConnected,
  l1ChainId,
  operation,
  overEstimation,
}: UseEstimateGasFees) {
  const { crossChainMessenger, crossChainMessengerStatus } =
    useCrossChainMessenger(l1ChainId, expectedChainConnected)

  const isConnectedToExpectedChain = useIsConnectedToExpectedNetwork(
    expectedChainConnected,
  )

  const queryKeys = [
    l1ChainId,
    bvm.id,
    crossChainMessengerStatus,
    operation,
    amount,
    Object.keys(crossChainMessenger?.estimateGas ?? {}),
  ]

  const { data = BigInt(0), status } = useQuery(
    queryKeys,
    async function () {
      const estimate = await crossChainMessenger.estimateGas[operation](amount)
      return estimate.toBigInt()
    },
    {
      enabled:
        isConnectedToExpectedChain &&
        crossChainMessengerStatus === 'success' &&
        // @ts-expect-error isNaN also accepts strings!
        !isNaN(amount) &&
        BigInt(amount) > BigInt(0) &&
        Object.keys(crossChainMessenger.estimateGas).length > 0,
    },
  )

  return useEstimateFees({
    chainId: expectedChainConnected,
    enabled: status === 'success',
    gasUnits: data,
    overEstimation,
  })
}

export const useDepositNativeToken = function (
  l1ChainId: Chain['id'],
  toDeposit: string,
) {
  const { crossChainMessenger, crossChainMessengerStatus } =
    useCrossChainMessenger(l1ChainId, l1ChainId)

  const depositNativeTokenGasFees = useEstimateGasFees({
    amount: toDeposit,
    expectedChainConnected: l1ChainId,
    l1ChainId,
    operation: 'depositETH',
    overEstimation: defaultOverEstimation,
  })

  const {
    data: depositNativeTokenTxHash,
    mutate: depositNativeToken,
    status,
  } = useMutation<string, Error, string>({
    mutationFn: async function withdraw(amount: string) {
      const response = await crossChainMessenger.depositETH(amount)
      return response.hash
    },
    mutationKey: [l1ChainId, bvm.id, crossChainMessengerStatus, toDeposit],
  })

  return {
    depositNativeToken: () => depositNativeToken(toDeposit),
    depositNativeTokenGasFees,
    depositNativeTokenTxHash,
    status,
  }
}

export const useWithdrawNativeToken = function (
  l1ChainId: Chain['id'],
  toWithdraw: string,
) {
  const { crossChainMessenger, crossChainMessengerStatus } =
    useCrossChainMessenger(l1ChainId, bvm.id)

  const withdrawNativeTokenGasFees = useEstimateGasFees({
    amount: toWithdraw,
    expectedChainConnected: bvm.id,
    l1ChainId,
    operation: 'withdrawETH',
    overEstimation: defaultOverEstimation,
  })

  const {
    data: withdrawTxHash,
    mutate: withdrawNativeToken,
    status: userWithdrawConfirmationStatus,
  } = useMutation<string, Error, string>({
    mutationFn: async function withdraw(amount: string) {
      const response = await crossChainMessenger.withdrawETH(amount)
      return response.hash
    },
    mutationKey: [l1ChainId, bvm.id, crossChainMessengerStatus, toWithdraw],
  })

  return {
    userWithdrawConfirmationStatus,
    withdrawNativeToken: () => withdrawNativeToken(toWithdraw),
    withdrawNativeTokenGasFees,
    withdrawTxHash,
  }
}
