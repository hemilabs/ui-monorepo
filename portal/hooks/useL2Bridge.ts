import {
  MessageDirection,
  MessageReceipt,
  MessageStatus,
  type CrossChainMessenger as CrossChainMessengerType,
  type SignerOrProviderLike,
} from '@eth-optimism/sdk'
import {
  UseMutationOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { hemi } from 'app/networks'
import { useJsonRpcProvider, useWeb3Provider } from 'hooks/useEthersSigner'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { Token } from 'types/token'
import { ZeroAddress } from 'utils/token'
import { type Address, type Chain, type Hash, isHash } from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount } from 'wagmi'

import { useEstimateFees } from './useEstimateFees'

const sdkPromise = import('@eth-optimism/sdk')

const l1Contracts = {
  AddressManager: process.env.NEXT_PUBLIC_ADDRESS_MANAGER as Address,
  BondManager: ZeroAddress,
  CanonicalTransactionChain: ZeroAddress,
  L1CrossDomainMessenger: process.env
    .NEXT_PUBLIC_PROXY_OVM_L1_CROSS_DOMAIN_MESSENGER as Address,
  L1StandardBridge: process.env
    .NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE as Address,
  L2OutputOracle: process.env.NEXT_PUBLIC_L2_OUTPUT_ORACLE_PROXY as Address,
  OptimismPortal: process.env.NEXT_PUBLIC_OPTIMISM_PORTAL_PROXY as Address,
  StateCommitmentChain: ZeroAddress,
}

// Some chains exist before Hemi. Therefore, it does not make sense to
// search in the entire blockchain for deposits. We only need to search from blocks
// whose date is after the genesis block in Hemi.
// This should be updated once Hemi is deployed to mainnet.
const l1ChainHemiBirthBlock = {
  [sepolia.id]: 5294649,
}

async function getCrossChainMessenger({
  l1ChainId,
  l1Signer,
  l2Signer,
}: {
  l1ChainId: Chain['id']
  l1Signer: SignerOrProviderLike
  l2Signer: SignerOrProviderLike
}) {
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
    l2ChainId: hemi.id,
    l2SignerOrProvider: l2Signer,
  })
}

type GasEstimationOperations = Extract<
  keyof CrossChainMessengerType['estimateGas'],
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

  // This Hook creates the dynamically loaded instance of the sdk's CrossChainMessenger
  // We can't use useMemo because it only works for synchronous code
  // Other options are using context, useQuery or a useRef to keep a single instance.
  // However, the instance depends on the address and chain connected, which makes it complex
  // to handle in React's context (it will require useEffect for different scenarios).
  const { data: crossChainMessenger, status: crossChainMessengerStatus } =
    useQuery({
      enabled: isConnectedToCorrectChain && !!l1Signer && !!l2Signer,
      queryFn: () => getCrossChainMessenger({ l1ChainId, l1Signer, l2Signer }),
      queryKey: [l1ChainId, walletConnectedToChain],
    })

  return {
    crossChainMessenger,
    crossChainMessengerStatus,
  }
}

type UseEstimateGasFees<T extends GasEstimationOperations> = {
  args: Parameters<CrossChainMessengerType['estimateGas'][T]>
  crossChainMessenger: CrossChainMessengerType
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

  const { data = BigInt(0), status } = useQuery({
    enabled:
      enabled &&
      isConnectedToExpectedChain &&
      crossChainMessengerStatus === 'success' &&
      Object.keys(crossChainMessenger.estimateGas).length > 0,
    async queryFn() {
      // @ts-expect-error this works, unsure why TS is not picking it up
      const estimate = await crossChainMessenger.estimateGas[operation](...args)
      return estimate.toBigInt()
    },
    queryKey: [
      operation,
      ...Object.keys(crossChainMessenger?.estimateGas ?? {}),
      ...args,
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
const useConnectedChainCrossChainMessenger = function (l1ChainId: Chain['id']) {
  const { chainId } = useAccount()
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

export const useGetDepositsByAddress = function (l1ChainId: Chain['id']) {
  const { address, chainId } = useAccount()

  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  const { data: deposits, ...rest } = useQuery({
    // ensure correct chain was used
    enabled: crossChainMessengerStatus === 'success',
    queryFn: () =>
      crossChainMessenger.getDepositsByAddress(address, {
        fromBlock: l1ChainHemiBirthBlock[l1ChainId],
      }),
    queryKey: [address, chainId, l1ChainId, 'deposit'],
  })

  return {
    deposits,
    ...rest,
  }
}

export const useGetWithdrawalsByAddress = function () {
  const { address, chainId } = useAccount()
  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(chainId)
  const { data: withdrawals, ...rest } = useQuery({
    // ensure correct chain was used
    enabled: crossChainMessengerStatus === 'success',
    queryFn: () => crossChainMessenger.getWithdrawalsByAddress(address),
    queryKey: [address, chainId, 'withdrawals'],
  })

  return {
    withdrawals,
    ...rest,
  }
}

type UseGetTransactionMessageStatus = {
  crossChainMessenger: CrossChainMessengerType
  crossChainMessengerStatus: 'error' | 'pending' | 'success'
  direction?: MessageDirection
  l1ChainId: Chain['id']
  refetchUntilStatus?: MessageStatus
  transactionHash: Hash
}

const useGetTransactionMessageStatus = function ({
  crossChainMessenger,
  crossChainMessengerStatus,
  direction,
  l1ChainId,
  refetchUntilStatus,
  transactionHash,
}: UseGetTransactionMessageStatus) {
  const { data: messageStatus, isLoading } = useQuery({
    // ensure correct chain was used
    enabled:
      crossChainMessengerStatus === 'success' &&
      l1ChainId !== hemi.id &&
      !!transactionHash,
    queryFn: () =>
      crossChainMessenger.getMessageStatus(
        transactionHash,
        // default value
        0,
        direction,
      ),
    queryKey: [direction, l1ChainId, transactionHash, 'getMessageStatus'],
    refetchInterval(query) {
      // if message status is ready to prove, or no refetch was requested, stop polling
      if (query.state.data === refetchUntilStatus) {
        return false
      }
      // poll every 1 minute
      return 60 * 1000
    },
    refetchIntervalInBackground: true,
  })

  return {
    isLoadingMessageStatus: isLoading,
    messageStatus,
  }
}

/**
 * Use this method to query the status of a transaction message
 * while connected to any chain.
 */
export const useAnyChainGetTransactionMessageStatus = function ({
  l1ChainId,
  ...options
}: Omit<
  UseGetTransactionMessageStatus,
  'crossChainMessenger' | 'crossChainMessengerStatus'
>) {
  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)
  return useGetTransactionMessageStatus({
    crossChainMessenger,
    crossChainMessengerStatus,
    l1ChainId,
    ...options,
  })
}

/**
 * Use this method to query the status of a transaction message
 * while connected to the L1 chain
 */
export const useL1GetTransactionMessageStatus = function ({
  direction,
  l1ChainId,
  refetchUntilStatus,
  transactionHash,
}: Omit<
  UseGetTransactionMessageStatus,
  'crossChainMessenger' | 'crossChainMessengerStatus'
>) {
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)
  return useGetTransactionMessageStatus({
    crossChainMessenger,
    crossChainMessengerStatus,
    direction,
    l1ChainId,
    refetchUntilStatus,
    transactionHash,
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
  const operation = 'depositERC20'
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)

  const l1BridgeAddress = token.address
  const l2BridgeAddress = token.extensions?.bridgeInfo[hemi.id]?.tokenAddress

  const depositErc20TokenGasFees = useEstimateGasFees({
    args: [l1BridgeAddress, l2BridgeAddress, toDeposit],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled:
      enabled && // @ts-expect-error isNaN also accepts strings!
      !isNaN(toDeposit) &&
      BigInt(toDeposit) > BigInt(0),
    operation,
    walletConnectedToChain: l1ChainId,
  })

  const depositErc20TokenMutationKey = [operation]

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
      )
      return response.hash as Hash
    },
    mutationKey: depositErc20TokenMutationKey,
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
    depositErc20TokenMutationKey,
    depositErc20TokenTxHash,
    l1StandardBridgeAddress: l1Contracts.L1StandardBridge,
    resetDepositToken,
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
  const operation = 'depositETH'
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)

  const depositNativeTokenGasFees = useEstimateGasFees({
    args: [toDeposit],
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

  const depositNativeMutationKey = [operation]

  const {
    data: depositNativeTokenTxHash,
    error: depositNativeTokenError,
    mutate: depositNativeToken,
    reset: resetDepositNativeToken,
  } = useMutation({
    async mutationFn(amount: string) {
      const response = await crossChainMessenger.depositETH(amount)
      return response.hash as Hash
    },
    mutationKey: depositNativeMutationKey,
  })

  return {
    depositNativeMutationKey,
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
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL2toL1CrossChainMessenger(l1ChainId)

  const withdrawNativeTokenGasFees = useEstimateGasFees({
    // Need to manually override from address - See https://github.com/ethereum-optimism/optimism/issues/8952
    args: [amount, { overrides: { from: address } }],
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

  const withdrawNativeTokenMutationKey = [operation]

  const {
    error: withdrawNativeTokenError,
    mutate: withdrawNativeToken,
    reset: resetWithdrawNativeToken,
  } = useMutation<Hash, Error, string>({
    async mutationFn(toWithdraw: string) {
      const response = await crossChainMessenger.withdrawETH(toWithdraw)
      return response.hash as Hash
    },
    mutationKey: withdrawNativeTokenMutationKey,
    ...options,
  })

  return {
    resetWithdrawNativeToken,
    withdrawNativeToken: () => withdrawNativeToken(amount),
    withdrawNativeTokenError,
    withdrawNativeTokenGasFees,
    withdrawNativeTokenMutationKey,
  }
}

type UseFinalizeMessage = {
  enabled: boolean
  l1ChainId: Chain['id']
  withdrawTxHash: Hash
} & Pick<UseMutationOptions<Hash, Error, string>, 'onSettled' | 'onSuccess'>

export const useFinalizeMessage = function ({
  enabled,
  l1ChainId,
  withdrawTxHash,
  ...options
}: UseFinalizeMessage) {
  const operation = 'finalizeMessage'
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)

  const finalizeWithdrawalTokenGasFees = useEstimateGasFees({
    args: [withdrawTxHash],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled: enabled && isHash(withdrawTxHash),
    operation,
    walletConnectedToChain: l1ChainId,
  })

  const finalizeWithdrawalMutationKey = [operation]

  const {
    data: finalizeWithdrawalTxHash,
    error: finalizeWithdrawalError,
    mutate: finalizeWithdrawal,
    reset: resetFinalizeWithdrawal,
  } = useMutation({
    async mutationFn(toFinalize: Hash) {
      const response = await crossChainMessenger.finalizeMessage(toFinalize)
      return response.hash as Hash
    },
    mutationKey: finalizeWithdrawalMutationKey,
    ...options,
  })

  return {
    finalizeWithdrawal: () => finalizeWithdrawal(withdrawTxHash),
    finalizeWithdrawalError,
    finalizeWithdrawalMutationKey,
    finalizeWithdrawalTokenGasFees,
    finalizeWithdrawalTxHash,
    resetFinalizeWithdrawal,
  }
}

type UseProveMessage = {
  enabled: boolean
  l1ChainId: Chain['id']
  withdrawTxHash: Address
}

export const useProveMessage = function ({
  enabled,
  l1ChainId,
  withdrawTxHash,
}: UseProveMessage) {
  const operation = 'proveMessage'
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL1ToL2CrossChainMessenger(l1ChainId)

  const proveWithdrawalTokenGasFees = useEstimateGasFees({
    args: [withdrawTxHash],
    crossChainMessenger,
    crossChainMessengerStatus,
    enabled: enabled && isHash(withdrawTxHash),
    operation,
    walletConnectedToChain: l1ChainId,
  })

  const proveWithdrawalMutationKey = [operation]

  const {
    data: proveWithdrawalTxHash,
    error: proveWithdrawalError,
    mutate: proveWithdrawal,
    reset: resetProveWithdrawal,
  } = useMutation({
    async mutationFn(toProve: Hash) {
      const response = await crossChainMessenger.proveMessage(toProve)
      return response.hash as Hash
    },
    mutationKey: proveWithdrawalMutationKey,
  })

  return {
    proveWithdrawal: () => proveWithdrawal(withdrawTxHash),
    proveWithdrawalError,
    proveWithdrawalMutationKey,
    proveWithdrawalTokenGasFees,
    proveWithdrawalTxHash,
    resetProveWithdrawal,
  }
}

type UseWithdrawToken = {
  amount: string
  enabled: boolean
  l1ChainId: Chain['id']
  token: Token
} & Pick<UseMutationOptions<Hash, Error, string>, 'onSettled' | 'onSuccess'>
export const useWithdrawToken = function ({
  amount,
  enabled,
  l1ChainId,
  token,
  ...options
}: UseWithdrawToken) {
  const operation = 'withdrawERC20'
  const { crossChainMessenger, crossChainMessengerStatus } =
    useL2toL1CrossChainMessenger(l1ChainId)

  const l1BridgeAddress = token.extensions?.bridgeInfo[l1ChainId].tokenAddress
  const l2BridgeAddress = token.address

  const withdrawErc20TokenGasFees = useEstimateGasFees({
    args: [l1BridgeAddress, l2BridgeAddress, amount],
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

  const withdrawErc20TokenMutationKey = [operation]

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
      )
      return response.hash as Hash
    },
    mutationKey: withdrawErc20TokenMutationKey,
    ...options,
  })

  return {
    resetWithdrawErc20Token,
    withdrawErc20Token: () => withdrawErc20Token(amount),
    withdrawErc20TokenError,
    withdrawErc20TokenGasFees,
    withdrawErc20TokenMutationKey,
  }
}
/**
 **Returns the Claim TX hash on the L1 or undefined if the withdrawal is not finalized
 */
export const useGetClaimWithdrawalTxHash = function (
  l1ChainId: Chain['id'],
  withdrawalTxHash: Hash,
) {
  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  const { data: receipt, ...rest } = useQuery<
    Partial<Pick<MessageReceipt['transactionReceipt'], 'transactionHash'>>
  >({
    enabled: crossChainMessengerStatus === 'success' && l1ChainId !== hemi.id,
    // return undefined for withdrawals not claimed yet
    queryFn: () =>
      crossChainMessenger
        .getMessageReceipt(withdrawalTxHash)
        // react-query doesn't allow saving undefined values in its cache
        // so we must return an object...
        .catch(() => ({ transactionReceipt: { transactionHash: undefined } }))
        .then(({ transactionReceipt }) => transactionReceipt),
    queryKey: [l1ChainId, withdrawalTxHash, 'getMessageReceipt'],
  })
  return {
    claimTxHash: receipt?.transactionHash as Hash | undefined,
    ...rest,
  }
}
