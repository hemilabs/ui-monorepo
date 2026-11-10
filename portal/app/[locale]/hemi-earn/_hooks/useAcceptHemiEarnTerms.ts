import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { useRef, useState } from 'react'
import { type Address, type Hex } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import {
  type HemiEarnTerms,
  hemiEarnTermsKeyPrefix,
} from '../_fetchers/fetchHemiEarnTerms'
import { hemiEarnTermsAcceptanceKeyPrefix } from '../_fetchers/fetchHemiEarnTermsAcceptance'
import { postHemiEarnTermsAcceptance } from '../_fetchers/postHemiEarnTermsAcceptance'
import {
  type AcceptanceFailure,
  classifyAcceptanceFailure,
} from '../_utils/termsGate'

type Signed = {
  account: Address
  issuedAt: number
  signature: Hex
  termsVersion: string
}

export const useAcceptHemiEarnTerms = function (terms: HemiEarnTerms) {
  const { address } = useAccount()
  const config = useConfig()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const [failure, setFailure] = useState<AcceptanceFailure | undefined>(
    undefined,
  )
  const signed = useRef<Signed | undefined>(undefined)

  const mutation = useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }
      const account = address

      await ensureConnectedTo(hemi.id)

      async function signAcceptance(): Promise<Signed> {
        const walletClient = await getWalletClient(config, { chainId: hemi.id })
        const issuedAt = Math.floor(Date.now() / 1000)
        const signature = await walletClient.signTypedData({
          account,
          domain: terms.domain,
          message: {
            account,
            issuedAt: BigInt(issuedAt),
            statement: terms.statement,
            termsHash: terms.termsHash,
            termsUrl: terms.termsUrl,
            termsVersion: terms.termsVersion,
          },
          primaryType: terms.primaryType,
          types: terms.types,
        })
        return {
          account,
          issuedAt,
          signature,
          termsVersion: terms.termsVersion,
        }
      }

      const previous = signed.current
      const current =
        previous !== undefined &&
        previous.account === account &&
        previous.termsVersion === terms.termsVersion
          ? previous
          : await signAcceptance()
      signed.current = current

      return postHemiEarnTermsAcceptance({
        account,
        apiUrl: import.meta.env.VITE_VETRO_API_URL,
        issuedAt: current.issuedAt,
        signature: current.signature,
        termsVersion: terms.termsVersion,
      })
    },
    onError(error: { status?: number }) {
      const nextFailure = classifyAcceptanceFailure({
        hasSignature: signed.current !== undefined,
        status: error.status,
      })
      if (nextFailure !== 'unexpected') {
        signed.current = undefined
      }
      if (nextFailure === 'terms-changed') {
        queryClient.invalidateQueries({ queryKey: hemiEarnTermsKeyPrefix })
      }
      setFailure(nextFailure)
    },
    onMutate() {
      setFailure(undefined)
    },
    onSuccess() {
      signed.current = undefined
      return queryClient.invalidateQueries({
        queryKey: hemiEarnTermsAcceptanceKeyPrefix,
      })
    },
  })

  return { ...mutation, failure }
}
