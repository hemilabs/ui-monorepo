import { JsonRpcSigner } from '@ethersproject/providers'
import { bvm } from 'app/networks'
import { useDelayedIdleStatus } from 'hooks/useDelayedIdleStatus'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { type FormEvent, useEffect } from 'react'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { parseUnits } from 'viem'
// Once we migrate to 2.x, @tanstack/react-query is moved into a peer dependency
// so we will have to install it manually and import useMutation from there
import { Chain, useMutation, useWaitForTransaction } from 'wagmi'

const zeroAddr = '0x'.padEnd(42, '0')
const sdkPromise = import('@eth-optimism/sdk')

// Calculated from Testnet, may need to be reviewed/updated
const WithdrawGas = 150_000

const getCrossChainMessenger = async function (
  l1ChainId: Chain['id'],
  l1Signer: JsonRpcSigner,
  l2Signer: JsonRpcSigner,
) {
  // dynamically load this component because it is very large
  const optimismSdk = await sdkPromise

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

  return new optimismSdk.CrossChainMessenger({
    bedrock: true,
    bridges: {
      ETH: {
        Adapter: optimismSdk.ETHBridgeAdapter,
        l1Bridge: l1Contracts.L1StandardBridge,
        l2Bridge: process.env.NEXT_PUBLIC_L2_BRIDGE,
      },
      Standard: {
        Adapter: optimismSdk.StandardBridgeAdapter,
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
}

type UseWithdraw = {
  canWithdraw: boolean
  fromInput: string
  fromToken: Token
  onSuccess: () => void
  toToken: Token
}
export const useWithdraw = function ({
  canWithdraw,
  fromInput,
  fromToken,
  onSuccess,
  toToken,
}: UseWithdraw) {
  const depositingNative = isNativeToken(fromToken)

  const l1Signer = useEthersSigner(fromToken.chainId)
  const l2Signer = useEthersSigner(bvm.id)

  const withdrawFees = useEstimateFees(fromToken.chainId, WithdrawGas)

  const {
    data: withdrawTxHash,
    mutate: withdrawNativeToken,
    status: userConfirmationStatus,
  } = useMutation<string, Error, void>({
    mutationFn: async function withdraw() {
      const crossChainMessenger = await getCrossChainMessenger(
        fromToken.chainId,
        l1Signer,
        l2Signer,
      )
      const response = await crossChainMessenger.withdrawETH(
        parseUnits(fromInput, fromToken.decimals).toString(),
      )
      return response.hash
    },
  })

  const { status: withdrawTxStatus } = useWaitForTransaction({
    // @ts-expect-error string is `0x${string}`
    hash: withdrawTxHash,
    onSuccess,
  })

  const [withdrawStatus, setWithdrawStatus] =
    useDelayedIdleStatus(withdrawTxStatus)

  useEffect(
    function clearWithdrawStatusAfterUserReject() {
      // When the user rejects a Tx, the withdraw status hangs on "Loading"
      // so we need to set it to error manually
      if (userConfirmationStatus === 'error') {
        setWithdrawStatus('error')
      }
    },
    [userConfirmationStatus, setWithdrawStatus],
  )

  useReloadBalances({
    fromToken,
    status: withdrawStatus,
    toToken,
  })

  const withdraw = function (e: FormEvent) {
    e.preventDefault()
    if (!canWithdraw) {
      return
    }
    if (depositingNative) {
      setWithdrawStatus('loading')
      withdrawNativeToken()
    }
    // TODO Enable withdraw ERC20 token
    // else {
    //   withdrawErc20Token()
    // }
  }

  return {
    withdraw,
    withdrawFees,
    withdrawStatus,
    withdrawTxHash,
  }
}
