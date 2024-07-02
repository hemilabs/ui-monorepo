import { useQuery, useQueryClient } from '@tanstack/react-query'
import { hemi } from 'app/networks'
import { useAccount } from 'btc-wallet/hooks/useAccount'
import { useSendBitcoin } from 'btc-wallet/hooks/useSendBitcoin'
import { Satoshis } from 'btc-wallet/unisat'
import { useCallback } from 'react'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
import {
  type Address,
  type ContractFunctionArgs,
  type ContractFunctionName,
  // Aliasing because I feel it better represents the intent I am using it for.
  getAddress as toChecksum,
} from 'viem'
import { useReadContract, type UseReadContractParameters } from 'wagmi'

import { custodianVaultAbi } from './btc-tunnel-abi/custodian-vault'
import { useWaitForTransactionReceipt } from './useWaitForTransactionReceipt'

const useBtcCustodialTunnel = function () {
  const { chainId } = useAccount()
  const { data: custodialAddress, ...rest } = useQuery({
    // in incoming iterations, the custodial address will be read programmatically
    // from bitcoin manager, once there's a determined way to get the "most adequate" custodial
    queryFn: () =>
      Promise.resolve('0x281AC403EdCB48b597e3674f6969a8D7c13b4859' as Address),
    queryKey: ['btc-custodial-tunnel-address', chainId],
  })
  return {
    custodialAddress,
    ...rest,
  }
}

type CustodianVaultAbi = typeof custodianVaultAbi

const useCustodianVault = function <
  FunctionName extends ContractFunctionName<CustodianVaultAbi, 'pure' | 'view'>,
  Args extends ContractFunctionArgs<
    CustodianVaultAbi,
    'pure' | 'view',
    FunctionName
  >,
>(params: UseReadContractParameters<CustodianVaultAbi, FunctionName, Args>) {
  const { custodialAddress } = useBtcCustodialTunnel()
  return useReadContract<CustodianVaultAbi, FunctionName, Args>({
    abi: custodianVaultAbi,
    address: custodialAddress,
    chainId: hemi.id,
    ...params,
  })
}

const useGetBitcoinCustodyAddress = function () {
  const { data: bitcoinVaultAddress, ...rest } = useCustodianVault({
    functionName: 'getBitcoinCustodyAddress',
  })
  return {
    bitcoinVaultAddress,
    ...rest,
  }
}

export const useDepositBitcoin = function () {
  const { setQueryParams } = useQueryParams()
  const { bitcoinVaultAddress } = useGetBitcoinCustodyAddress()
  const queryClient = useQueryClient()
  const {
    error: depositError,
    reset: resetSendBitcoin,
    sendBitcoin,
    txId,
  } = useSendBitcoin({
    onSuccess: result => setQueryParams({ txHash: result }, 'push'),
  })

  const depositBitcoin = (satoshis: Satoshis, hemiAddress: Address) =>
    sendBitcoin({
      options: {
        // Max Sanchez note: looks like if we pass in all lower-case hex, Unisat publishes the bytes instead of the string.
        // Tunnel for now is only validating the string representation, but update this in the future using
        // the all-lower-case-hex way to get the raw bytes published, which is more efficient.
        memo: toChecksum(hemiAddress).slice(2),
      },
      satoshis,
      to: bitcoinVaultAddress,
    })

  const {
    data: depositReceipt,
    error: depositReceiptError,
    queryKey: depositQueryKey,
  } = useWaitForTransactionReceipt({ txId })

  const clearDepositState = useCallback(
    function () {
      // reset the sendBitcoin state
      resetSendBitcoin()
      // clear deposit receipt state
      queryClient.invalidateQueries({ queryKey: depositQueryKey })
    },
    [depositQueryKey, queryClient, resetSendBitcoin],
  )

  return {
    clearDepositState,
    depositBitcoin,
    depositError,
    depositReceipt,
    depositReceiptError,
    depositTxId: txId,
  }
}
