import { type CrossChainMessenger as CrossChainMessengerType } from '@eth-optimism/sdk'
import { bvm } from 'app/networks'
import {
  type Provider,
  useJsonRpcProvider,
  useWeb3Provider,
} from 'hooks/useEthersSigner'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { Token } from 'types/token'
import { type Chain, useMutation, useQuery } from 'wagmi'

import { useEstimateFees } from './useEstimateFees'

const sdkPromise = import('@eth-optimism/sdk')

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

type UseCrossChainMessenger = {
  l1ChainId: Chain['id']
  walletConnectedToChain: Chain['id']
  l1Signer: Provider
  l2Signer: Provider
}
const useCrossChainMessenger = function ({
  walletConnectedToChain,
  l1ChainId,
  l1Signer,
  l2Signer,
}: UseCrossChainMessenger) {
  const isConnectedToCorrectChain = useIsConnectedToExpectedNetwork(
    walletConnectedToChain,
  )

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
        enabled: isConnectedToCorrectChain && !!l1Signer && !!l2Signer,
      },
    )

  return {
    crossChainMessenger,
    crossChainMessengerStatus,
  }
}

type GasEstimationOperations = Extract<
  keyof CrossChainMessengerType['estimateGas'],
  'depositERC20' | 'depositETH' | 'withdrawETH'
>

type UseEstimateGasFees<T extends GasEstimationOperations> = {
  amount: string
  args: Parameters<CrossChainMessengerType['estimateGas'][T]>
  crossChainMessenger: CrossChainMessengerType
  crossChainMessengerStatus: string
  enabled: boolean
  operation: T
  walletConnectedToChain: Chain['id']
}
const useEstimateGasFees = function <T extends GasEstimationOperations>({
  amount,
  args,
  crossChainMessenger,
  crossChainMessengerStatus,
  enabled,
  operation,
  walletConnectedToChain,
}: UseEstimateGasFees<T>) {
  const isConnectedToExpectedChain = useIsConnectedToExpectedNetwork(
    walletConnectedToChain,
  )

  const queryKeys = [
    crossChainMessengerStatus,
    operation,
    Object.keys(crossChainMessenger?.estimateGas ?? {}),
    ...args,
  ]

  const { data = BigInt(0), status } = useQuery(
    queryKeys,
    async function () {
      // @ts-expect-error this works, unsure why TS is not picking it up
      const estimate = await crossChainMessenger.estimateGas[operation](...args)
      return estimate.toBigInt()
    },
    {
      enabled:
        enabled &&
        isConnectedToExpectedChain &&
        crossChainMessengerStatus === 'success' &&
        // @ts-expect-error isNaN also accepts strings!
        !isNaN(amount) &&
        BigInt(amount) > BigInt(0) &&
        Object.keys(crossChainMessenger.estimateGas).length > 0,
    },
  )

  return useEstimateFees({
    chainId: walletConnectedToChain,
    enabled: status === 'success',
    gasUnits: data,
  })
}

type UseDepositErc20Token = {
  enabled: boolean
  l1ChainId: Chain['id']
  toDeposit: string
  token: Token
}
export const useDepositErc20Token = function ({
  enabled,
  l1ChainId,
  toDeposit,
  token,
}: UseDepositErc20Token) {
  const l1Signer = useWeb3Provider(l1ChainId)
  const l2Signer = useJsonRpcProvider(bvm.id)

  const { crossChainMessenger, crossChainMessengerStatus } =
    useCrossChainMessenger({
      l1ChainId,
      l1Signer,
      l2Signer,
      walletConnectedToChain: l1ChainId,
    })

  const l1BridgeAddress = token.address
  const l2BridgeAddress = token.extensions?.bridgeInfo[bvm.id].tokenAddress

  const depositErc20TokenGasFees = useEstimateGasFees({
    amount: toDeposit,
    args: [l1BridgeAddress, l2BridgeAddress, toDeposit],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled,
    operation: 'depositERC20',
    walletConnectedToChain: l1ChainId,
  })

  const {
    data: depositErc20TokenTxHash,
    mutate: depositErc20Token,
    status,
  } = useMutation<string, Error, string>({
    mutationFn: async function deposit(amount: string) {
      const response = await crossChainMessenger.depositERC20(
        l1BridgeAddress,
        l2BridgeAddress,
        amount,
      )
      return response.hash
    },
    mutationKey: [
      l1ChainId,
      bvm.id,
      crossChainMessengerStatus,
      l1BridgeAddress,
      l2BridgeAddress,
      toDeposit,
    ],
  })

  return {
    depositErc20Token: () => depositErc20Token(toDeposit),
    depositErc20TokenGasFees,
    depositErc20TokenTxHash,
    l1StandardBridgeAddress: l1Contracts.L1StandardBridge,
    status,
  }
}

type UseDepositNativeToken = {
  enabled: boolean
  l1ChainId: Chain['id']
  toDeposit: string
}
export const useDepositNativeToken = function ({
  enabled,
  l1ChainId,
  toDeposit,
}: UseDepositNativeToken) {
  const l1Signer = useWeb3Provider(l1ChainId)
  const l2Signer = useJsonRpcProvider(bvm.id)

  const { crossChainMessenger, crossChainMessengerStatus } =
    useCrossChainMessenger({
      l1ChainId,
      l1Signer,
      l2Signer,
      walletConnectedToChain: l1ChainId,
    })

  const depositNativeTokenGasFees = useEstimateGasFees({
    amount: toDeposit,
    args: [toDeposit],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled,
    operation: 'depositETH',
    walletConnectedToChain: l1ChainId,
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

type UseWithdrawNativeToken = {
  enabled: boolean
  l1ChainId: Chain['id']
  toWithdraw: string
}
export const useWithdrawNativeToken = function ({
  enabled,
  l1ChainId,
  toWithdraw,
}: UseWithdrawNativeToken) {
  const l1Signer = useJsonRpcProvider(l1ChainId)
  const l2Signer = useWeb3Provider(bvm.id)

  const { crossChainMessenger, crossChainMessengerStatus } =
    useCrossChainMessenger({
      l1ChainId,
      l1Signer,
      l2Signer,
      walletConnectedToChain: bvm.id,
    })

  const withdrawNativeTokenGasFees = useEstimateGasFees({
    amount: toWithdraw,
    args: [toWithdraw],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled,
    operation: 'withdrawETH',
    walletConnectedToChain: bvm.id,
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
