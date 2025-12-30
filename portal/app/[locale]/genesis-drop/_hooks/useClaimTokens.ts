import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventEmitter } from 'events'
import {
  EligibilityData,
  type ClaimEvents,
  type LockupMonths,
} from 'genesis-drop-actions'
import { claimTokens } from 'genesis-drop-actions/actions'
import { useNativeTokenBalance } from 'hooks/useBalance'
import { useEnsureConnectedTo } from 'hooks/useEnsureConnectedTo'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useUmami } from 'hooks/useUmami'
import { Hex } from 'viem'
import { useAccount } from 'wagmi'

import { getClaimTransactionQueryKey } from './useGetClaimTransaction'
import { getIsClaimableQueryKey } from './useIsClaimable'

export const useClaimTokens = function ({
  eligibility,
  on,
}: {
  eligibility: EligibilityData
  on?(emitter: EventEmitter<ClaimEvents>): void
}) {
  const { address } = useAccount()
  const hemi = useHemi()
  const ensureConnectedTo = useEnsureConnectedTo()
  const { hemiWalletClient } = useHemiWalletClient()
  const queryClient = useQueryClient()
  const { track } = useUmami()

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    hemi.id,
  )

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemi.id,
  )

  return useMutation({
    async mutationFn({
      lockupMonths,
      ratio,
      termsSignature,
    }: {
      lockupMonths: LockupMonths
      ratio: number
      termsSignature: Hex
    }) {
      if (!address) {
        throw new Error('User is not connected')
      }

      track?.('genesis-drop - submit start', { lockupMonths })

      await ensureConnectedTo(hemi.id)

      const { emitter, promise } = claimTokens({
        address,
        amount: eligibility.amount,
        claimGroupId: eligibility.claimGroupId,
        lockupMonths,
        proof: eligibility.proof,
        ratio,
        termsSignature,
        walletClient: hemiWalletClient!,
      })

      emitter.on(
        'claim-failed-validation',
        () => track?.('genesis-drop - failed validation', { lockupMonths }),
      )

      emitter.on('claim-transaction-succeeded', function (receipt) {
        // update native balance on the wallet due to gas paid
        updateNativeBalanceAfterFees(receipt)

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

        queryClient.setQueryData(claimTransactionQueryKey, {
          amount: eligibility.amount,
          lockupMonths,
          ratio,
          transactionHash: receipt.transactionHash,
        })
        // optimistically update isClaimable to false.
        queryClient.setQueryData(isClaimableKey, false)

        track?.('genesis-drop - submit success', { lockupMonths })
      })

      emitter.on('claim-transaction-reverted', function (receipt) {
        // update native balance on the wallet due to gas paid
        updateNativeBalanceAfterFees(receipt)

        track?.('genesis-drop - submit reverted', { lockupMonths })
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      // at this point, variables are defined because mutation run
      const isClaimableKey = getIsClaimableQueryKey({
        address: address!,
        amount: eligibility!.amount,
        claimGroupId: eligibility!.claimGroupId,
        hemiId: hemi.id,
        proof: eligibility!.proof,
      })

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
