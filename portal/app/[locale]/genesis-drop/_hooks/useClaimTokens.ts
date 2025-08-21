import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventEmitter } from 'events'
import { type ClaimEvents, type LockupMonths } from 'genesis-drop-actions'
import { claimTokens } from 'genesis-drop-actions/actions'
import { useNativeTokenBalance } from 'hooks/useBalance'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { Hash } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'

import { useEligibleForTokens } from './useEligibleForTokens'
import { getClaimTransactionQueryKey } from './useGetClaimTransaction'
import { getIsClaimableQueryKey } from './useIsClaimable'

export const useClaimTokens = function (options?: {
  on(emitter: EventEmitter<ClaimEvents>): void
}) {
  const { address } = useAccount()
  const { data: eligibility } = useEligibleForTokens()
  const hemi = useHemi()
  const connectedToHemi = useIsConnectedToExpectedNetwork(hemi.id)
  const { hemiWalletClient } = useHemiWalletClient()
  const queryClient = useQueryClient()
  const { switchChainAsync } = useSwitchChain()

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    hemi.id,
  )

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemi.id,
  )

  const claimTransactionQueryKey = getClaimTransactionQueryKey({
    address,
    chainId: hemi.id,
    claimGroupId: eligibility.claimGroupId,
  })

  const isClaimableKey = getIsClaimableQueryKey({
    address,
    amount: eligibility.amount,
    claimGroupId: eligibility.claimGroupId,
    hemiId: hemi.id,
    proof: eligibility.proof,
  })

  return useMutation({
    async mutationFn({
      lockupMonths,
      ratio,
      termsSignature,
    }: {
      lockupMonths: LockupMonths
      ratio: number
      termsSignature: Hash
    }) {
      if (!connectedToHemi) {
        await switchChainAsync({ chainId: hemi.id })
      }

      const { emitter, promise } = claimTokens({
        address,
        amount: eligibility.amount,
        claimGroupId: eligibility.claimGroupId,
        lockupMonths,
        proof: eligibility.proof,
        ratio,
        termsSignature,
        walletClient: hemiWalletClient,
      })

      emitter.on('claim-transaction-succeeded', function (receipt) {
        // update native balance on the wallet due to gas paid
        updateNativeBalanceAfterFees(receipt)
        queryClient.setQueryData(claimTransactionQueryKey, {
          amount: eligibility.amount,
          lockupMonths,
          ratio,
          transactionHash: receipt.transactionHash,
        })
        // optimistically update isClaimable to false.
        queryClient.setQueryData(isClaimableKey, false)
      })

      emitter.on('claim-transaction-reverted', function (receipt) {
        // update native balance on the wallet due to gas paid
        updateNativeBalanceAfterFees(receipt)
      })

      options?.on(emitter)

      return promise
    },
    onSettled() {
      // invalidate gas balance on the wallet
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      // invalidate updated contracts
      queryClient.invalidateQueries({ queryKey: isClaimableKey })
      // Do not invalidate claimTransactionQueryKey - as this is not reading the contract
      // but a subgraph through an API, there may be a small delay, and the API may not return the found transaction
      // let's use the optimistic update instead to show the success page
      // from what I could test, it may take at most only a few seconds for the TX to show up, but it is not instant
    },
  })
}
