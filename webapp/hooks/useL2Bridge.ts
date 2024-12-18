import { type SignerOrProviderLike } from '@eth-optimism/sdk'
import {
  UseMutationOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { useJsonRpcProvider, useWeb3Provider } from 'hooks/useEthersSigner'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import merge from 'lodash/merge'
import { Token } from 'types/token'
import {
  type CrossChainMessengerProxy,
  createIsolatedCrossChainMessenger,
} from 'utils/crossChainMessenger'
import { hasKeys } from 'utils/utilities'
import { type Chain, type Hash, checksumAddress, isHash } from 'viem'
import { useAccount } from 'wagmi'

import { useEstimateFees } from './useEstimateFees'
import { useHemi } from './useHemi'

// Adding a cap to gasLimit for L1 operations in the tunnel, as the SDK overestimates
// the gas estimation by many orders of magnitude, causing the app to show a extremely high gas estimation that is later not paid
// This number was calculated by Max after analyzing several Tunnel operations in Sepolia, and may be removed in the future
// See https://github.com/hemilabs/ui-monorepo/issues/539
const l1GasLimitOverride = 2_000_000

const tunnelOverrides = {
  // enable usage of EIP-1559
  overrides: { type: 2 },
}

const l1OverridesTestnet = merge(
  {
    overrides: {
      gasLimit: l1GasLimitOverride,
    },
  },
  tunnelOverrides,
)

type GasEstimationOperations = Extract<
  keyof CrossChainMessengerProxy['estimateGas'],
  | 'depositERC20'
  | 'depositETH'
  | 'finalizeMessage'
  | 'proveMessage'
  | 'withdrawERC20'
  | 'withdrawETH'
>

type UseCrossChainMessenger = {
  l1ChainId: Chain['id']
  walletConnectedToChain: Chain['id']
  l1Signer: SignerOrProviderLike
  l2Signer: SignerOrProviderLike
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
  const hemi = useHemi()

  // This Hook creates the dynamically loaded instance of the sdk's CrossChainMessenger
  // We can't use useMemo because it only works for synchronous code
  // Other options are using context, useQuery or a useRef to keep a single instance.
  // However, the instance depends on the address and chain connected, which makes it complex
  // to handle in React's context (it will require useEffect for different scenarios).
  const { data: crossChainMessenger, status: crossChainMessengerStatus } =
    useQuery({
      enabled: isConnectedToCorrectChain && !!l1Signer && !!l2Signer,
      queryFn: () =>
        createIsolatedCrossChainMessenger({
          l1ChainId,
          l1Signer,
          l2Chain: hemi,
          l2Signer,
        }),
      queryKey: [hemi.id, l1ChainId, walletConnectedToChain],
    })

  return {
    crossChainMessenger,
    crossChainMessengerStatus,
  }
}

type UseEstimateGasFees<T extends GasEstimationOperations> = {
  args: Parameters<CrossChainMessengerProxy['estimateGas'][T]>
  crossChainMessenger: CrossChainMessengerProxy
  crossChainMessengerStatus: string
  enabled: boolean
  operation: T
  walletConnectedToChain: Chain['id']
}
const useEstimateGasFees = function <T extends GasEstimationOperations>({
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
  const hemi = useHemi()

  const hardcodedOps = [
    'depositERC20',
    'depositETH',
    'finalizeMessage',
    'proveMessage',
  ]

  const { data = BigInt(0), status } = useQuery({
    enabled:
      enabled &&
      isConnectedToExpectedChain &&
      crossChainMessengerStatus === 'success' &&
      hasKeys(crossChainMessenger.estimateGas),
    async queryFn() {
      if (hardcodedOps.includes(operation) && hemi.testnet) {
        // See https://github.com/hemilabs/ui-monorepo/issues/539
        return BigInt(l1GasLimitOverride)
      }
      // @ts-expect-error this works, unsure why TS is not picking it up
      const estimate = await crossChainMessenger.estimateGas[operation](...args)
      return estimate.toBigInt()
    },
    queryKey: [
      operation,
      ...Object.keys(crossChainMessenger?.estimateGas ?? {}),
      ...args,
      hemi.testnet,
    ],
    // update gas fees every 15 seconds
    refetchInterval: 15 * 1000,
  })

  return useEstimateFees({
    chainId: walletConnectedToChain,
    enabled: status === 'success',
    gasUnits: data,
  })
}

/**
 * This hook returns an instance of crossChainMessenger in which the wallet is connected to the L1
 * and uses a JsonRpcProvider to connect to the L2
 * @param l1ChainId
 * @returns
 */
const useL1ToL2CrossChainMessenger = function (l1ChainId: Chain['id']) {
  const hemi = useHemi()
  const l1Signer = useWeb3Provider(l1ChainId)
  const l2Signer = useJsonRpcProvider(hemi.id)

  return useCrossChainMessenger({
    l1ChainId,
    l1Signer,
    l2Signer,
    walletConnectedToChain: l1ChainId,
  })
}

/**
 * This hook returns an instance of crossChainMessenger in which the wallet is connected to the L2
 * and uses a JsonRpcProvider to connect to the L1
 * @param l1ChainId
 * @returns
 */
const useL2toL1CrossChainMessenger = function (l1ChainId: Chain['id']) {
  const hemi = useHemi()

  const l1Signer = useJsonRpcProvider(l1ChainId)
  const l2Signer = useWeb3Provider(hemi.id)

  return useCrossChainMessenger({
    l1ChainId,
    l1Signer,
    l2Signer,
    walletConnectedToChain: hemi.id,
  })
}

/**
 * This hook returns a web3Signer for the chain the wallet is connected to, and a jsonSigner for the chain
 * the user is not connected, regardless of which one is the L2 and the L1
 * @param l1ChainId
 * @returns {object}
 */
export const useConnectedChainCrossChainMessenger = function (
  l1ChainId: Chain['id'],
) {
  const { chainId } = useAccount()
  const hemi = useHemi()

  const isConnectedToL2 = chainId === hemi.id

  const web3Signer = useWeb3Provider(chainId)
  const jsonSigner = useJsonRpcProvider(isConnectedToL2 ? l1ChainId : hemi.id)

  const signers = isConnectedToL2
    ? {
        l1Signer: jsonSigner,
        l2Signer: web3Signer,
      }
    : {
        l1Signer: web3Signer,
        l2Signer: jsonSigner,
      }

  return useCrossChainMessenger({
    ...signers,
    l1ChainId,
    walletConnectedToChain: chainId,
  })
}

type UseDepositErc20Token = {
  enabled: boolean
  fromToken: Token
  toDeposit: string
  toToken: Token
} & Pick<
  UseMutationOptions<
    Hash,
    Error,
    {
      amount: string
      l1Address: string
      l2Address: string
    }
  >,
  'onSettled' | 'onSuccess'
>

export const useDepositErc20Token = function ({
  enabled,
  fromToken,
  toDeposit,
  toToken,
  ...options
}: UseDepositErc20Token) {
  const operation = 'depositERC20'
  const l1ChainId = fromToken.chainId as Chain['id']
  const hemi = useHemi()
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)

  // @ts-expect-error string is `0x${string}`
  const l1BridgeAddress = checksumAddress(fromToken.address)
  // @ts-expect-error string is `0x${string}`
  const l2BridgeAddress = checksumAddress(toToken.address)

  const overrides = hemi.testnet ? l1OverridesTestnet : tunnelOverrides

  const depositErc20TokenGasFees = useEstimateGasFees({
    args: [l1BridgeAddress, l2BridgeAddress, toDeposit, overrides],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled:
      enabled && // @ts-expect-error isNaN also accepts strings!
      !isNaN(toDeposit) &&
      BigInt(toDeposit) > BigInt(0),
    operation,
    walletConnectedToChain: l1ChainId,
  })

  const {
    data: depositErc20TokenTxHash,
    error: depositErc20TokenError,
    mutate: depositErc20Token,
    reset: resetDepositToken,
    status,
  } = useMutation({
    async mutationFn({
      amount,
      l1Address,
      l2Address,
    }: {
      amount: string
      l1Address: string
      l2Address: string
    }) {
      const response = await crossChainMessenger.depositERC20(
        l1Address,
        l2Address,
        amount,
        overrides,
      )
      return response.hash as Hash
    },
    ...options,
  })

  return {
    depositErc20Token: () =>
      depositErc20Token({
        amount: toDeposit,
        l1Address: l1BridgeAddress,
        l2Address: l2BridgeAddress,
      }),
    depositErc20TokenError,
    depositErc20TokenGasFees,
    depositErc20TokenTxHash,
    resetDepositToken,
    status,
  }
}

type UseDepositNativeToken = {
  enabled: boolean
  l1ChainId: Chain['id']
  toDeposit: string
} & Pick<UseMutationOptions<Hash, Error, string>, 'onSettled' | 'onSuccess'>
export const useDepositNativeToken = function ({
  enabled,
  l1ChainId,
  toDeposit,
  ...options
}: UseDepositNativeToken) {
  const operation = 'depositETH'
  const { address } = useAccount()
  const hemi = useHemi()
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)

  const overrides = hemi.testnet ? l1OverridesTestnet : tunnelOverrides

  const depositNativeTokenGasFees = useEstimateGasFees({
    // Need to manually override from address - See https://github.com/ethereum-optimism/optimism/issues/8952
    args: [toDeposit, merge(overrides, { overrides: { from: address } })],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled:
      enabled &&
      // @ts-expect-error isNaN also accepts strings!
      !isNaN(toDeposit) &&
      BigInt(toDeposit) > BigInt(0),
    operation,
    walletConnectedToChain: l1ChainId,
  })

  const {
    data: depositNativeTokenTxHash,
    error: depositNativeTokenError,
    mutate: depositNativeToken,
    reset: resetDepositNativeToken,
  } = useMutation({
    async mutationFn(amount: string) {
      const response = await crossChainMessenger.depositETH(amount, overrides)
      return response.hash as Hash
    },
    ...options,
  })

  return {
    depositNativeToken: () => depositNativeToken(toDeposit),
    depositNativeTokenError,
    depositNativeTokenGasFees,
    depositNativeTokenTxHash,
    resetDepositNativeToken,
  }
}

type UseWithdrawNativeToken = {
  amount: string
  enabled: boolean
  l1ChainId: Chain['id']
} & Pick<UseMutationOptions<Hash, Error, string>, 'onSettled' | 'onSuccess'>

export const useWithdrawNativeToken = function ({
  amount,
  enabled,
  l1ChainId,
  ...options
}: UseWithdrawNativeToken) {
  const operation = 'withdrawETH'
  const { address, isConnected } = useAccount()
  const hemi = useHemi()
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL2toL1CrossChainMessenger(l1ChainId)

  const withdrawNativeTokenGasFees = useEstimateGasFees({
    // Need to manually override from address - See https://github.com/ethereum-optimism/optimism/issues/8952
    args: [amount, merge(tunnelOverrides, { overrides: { from: address } })],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled:
      enabled &&
      isConnected &&
      // @ts-expect-error isNaN also accepts strings!
      !isNaN(amount) &&
      BigInt(amount) > BigInt(0),
    operation,
    walletConnectedToChain: hemi.id,
  })

  const {
    error: withdrawNativeTokenError,
    mutate: withdrawNativeToken,
    reset: resetWithdrawNativeToken,
  } = useMutation<Hash, Error, string>({
    async mutationFn(toWithdraw: string) {
      const response = await crossChainMessenger.withdrawETH(
        toWithdraw,
        tunnelOverrides,
      )
      return response.hash as Hash
    },
    ...options,
  })

  return {
    resetWithdrawNativeToken,
    withdrawNativeToken: () => withdrawNativeToken(amount),
    withdrawNativeTokenError,
    withdrawNativeTokenGasFees,
  }
}

type UseFinalizeMessage = {
  enabled: boolean
  l1ChainId: Chain['id']
  withdrawTxHash: Hash
} & Omit<UseMutationOptions<Hash, Error, string>, 'mutationFn'>

export const useFinalizeMessage = function ({
  enabled,
  l1ChainId,
  withdrawTxHash,
  ...options
}: UseFinalizeMessage) {
  const operation = 'finalizeMessage'
  const hemi = useHemi()
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)

  const overrides = hemi.testnet ? l1OverridesTestnet : tunnelOverrides

  const finalizeWithdrawalTokenGasFees = useEstimateGasFees({
    args: [withdrawTxHash, overrides],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled: enabled && isHash(withdrawTxHash),
    operation,
    walletConnectedToChain: l1ChainId,
  })

  const {
    data: finalizeWithdrawalTxHash,
    error: finalizeWithdrawalError,
    mutate: finalizeWithdrawal,
    reset: resetFinalizeWithdrawal,
  } = useMutation({
    async mutationFn(toFinalize: Hash) {
      const response = await crossChainMessenger.finalizeMessage(
        toFinalize,
        overrides,
      )
      return response.hash as Hash
    },
    ...options,
  })

  return {
    finalizeWithdrawal: () => finalizeWithdrawal(withdrawTxHash),
    finalizeWithdrawalError,
    finalizeWithdrawalTokenGasFees,
    finalizeWithdrawalTxHash,
    resetFinalizeWithdrawal,
  }
}

type UseProveMessage = {
  enabled: boolean
  l1ChainId: Chain['id']
  withdrawTxHash: Hash
} & Omit<UseMutationOptions<Hash, Error, string>, 'mutationFn'>

export const useProveMessage = function ({
  enabled,
  l1ChainId,
  withdrawTxHash,
  ...options
}: UseProveMessage) {
  const operation = 'proveMessage'
  const hemi = useHemi()
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)

  const overrides = hemi.testnet ? l1OverridesTestnet : tunnelOverrides

  const proveWithdrawalTokenGasFees = useEstimateGasFees({
    args: [withdrawTxHash, overrides],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled: enabled && isHash(withdrawTxHash),
    operation,
    walletConnectedToChain: l1ChainId,
  })

  const {
    data: proveWithdrawalTxHash,
    error: proveWithdrawalError,
    mutate: proveWithdrawal,
    reset: resetProveWithdrawal,
  } = useMutation({
    async mutationFn(toProve: Hash) {
      const response = await crossChainMessenger.proveMessage(
        toProve,
        overrides,
      )
      return response.hash as Hash
    },
    ...options,
  })

  return {
    proveWithdrawal: () => proveWithdrawal(withdrawTxHash),
    proveWithdrawalError,
    proveWithdrawalTokenGasFees,
    proveWithdrawalTxHash,
    resetProveWithdrawal,
  }
}

type UseWithdrawToken = {
  amount: string
  enabled: boolean
  l1ChainId: Chain['id']
  fromToken: Token
  toToken: Token
} & Pick<UseMutationOptions<Hash, Error, string>, 'onSettled' | 'onSuccess'>
export const useWithdrawToken = function ({
  amount,
  enabled,
  fromToken,
  l1ChainId,
  toToken,
  ...options
}: UseWithdrawToken) {
  const operation = 'withdrawERC20'
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL2toL1CrossChainMessenger(l1ChainId)
  const hemi = useHemi()

  // @ts-expect-error string is `0x${string}`
  const l1BridgeAddress = checksumAddress(toToken.address)
  // @ts-expect-error string is `0x${string}`
  const l2BridgeAddress = checksumAddress(fromToken.address)

  const withdrawErc20TokenGasFees = useEstimateGasFees({
    args: [l1BridgeAddress, l2BridgeAddress, amount, tunnelOverrides],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled:
      enabled &&
      // @ts-expect-error isNaN also accepts strings!
      !isNaN(amount) &&
      BigInt(amount) > BigInt(0),
    operation,
    walletConnectedToChain: hemi.id,
  })

  const {
    error: withdrawErc20TokenError,
    mutate: withdrawErc20Token,
    reset: resetWithdrawErc20Token,
  } = useMutation<Hash, Error, string>({
    async mutationFn(toWithdraw: string) {
      const response = await crossChainMessenger.withdrawERC20(
        l1BridgeAddress,
        l2BridgeAddress,
        toWithdraw,
        tunnelOverrides,
      )
      return response.hash as Hash
    },
    ...options,
  })

  return {
    resetWithdrawErc20Token,
    withdrawErc20Token: () => withdrawErc20Token(amount),
    withdrawErc20TokenError,
    withdrawErc20TokenGasFees,
  }
}
