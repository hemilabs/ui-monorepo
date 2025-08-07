import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { LockupMonths } from 'tge-claim'
import { claimTokens } from 'tge-claim/actions'
import { Hash } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'

import { useEligibleForTokens } from './useEligibleForTokens'
import { getClaimTransactionQueryKey } from './useGetClaimTransaction'
import { getIsClaimableQueryKey } from './useIsClaimable'

export const useClaimTokens = function () {
  const { address } = useAccount()
  const eligibility = useEligibleForTokens()
  const hemi = useHemi()
  const connectedToHemi = useIsConnectedToExpectedNetwork(hemi.id)
  const { hemiWalletClient } = useHemiWalletClient()
  const queryClient = useQueryClient()
  const { switchChainAsync } = useSwitchChain()

  const claimTransactionQueryKey = getClaimTransactionQueryKey({
    address,
    chainId: hemi.id,
    claimGroupId: eligibility.claimGroupId,
  })

  const isClaimableKey = getIsClaimableQueryKey({
    address,
    eligibility,
    hemiId: hemi.id,
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
        account: address!,
        amount: BigInt(eligibility.amount),
        lockupMonths,
        ratio,
        termsSignature,
        walletClient: hemiWalletClient,
      })

      emitter.on('claim-transaction-succeeded', function (receipt) {
        // optimistically update the claim transaction
        // and set isClaimable to false. Then, onSettled, revalidate both.
        queryClient.setQueryData(claimTransactionQueryKey, {
          amount: eligibility.amount,
          lockupMonths,
          ratio,
          transactionHash: receipt.transactionHash,
        })

        queryClient.setQueryData(isClaimableKey, false)
      })

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: claimTransactionQueryKey })
      queryClient.invalidateQueries({ queryKey: isClaimableKey })
    },
  })
}
