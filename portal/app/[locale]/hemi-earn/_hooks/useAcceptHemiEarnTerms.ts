import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { useUmami } from 'hooks/useUmami'
import { useRef, useState } from 'react'
import {
  type Address,
  BaseError,
  type Hex,
  UserRejectedRequestError,
} from 'viem'
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
  const { track } = useUmami()
  const [failure, setFailure] = useState<AcceptanceFailure | undefined>(
    undefined,
  )
  // Sticky: the retry clears the failure, but the Terms stay the ones the
  // wallet has not read yet, so the view must not fall back to the handoff.
  const [termsChanged, setTermsChanged] = useState(false)
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
        track?.('hemi earn - terms signed')
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
    onError(error: Error & { status?: number }) {
      const nextFailure = classifyAcceptanceFailure({
        isUserRejection:
          error instanceof BaseError &&
          !!error.walk(cause => cause instanceof UserRejectedRequestError),
        status: error.status,
      })
      if (nextFailure === 'not-signed') {
        track?.('hemi earn - terms rejected')
      }
      if (nextFailure !== 'unexpected') {
        signed.current = undefined
      }
      if (nextFailure === 'terms-changed') {
        setTermsChanged(true)
        queryClient.invalidateQueries({ queryKey: hemiEarnTermsKeyPrefix })
      }
      setFailure(nextFailure)
    },
    onMutate() {
      setFailure(undefined)
    },
    onSuccess() {
      signed.current = undefined
      setTermsChanged(false)
      return queryClient.invalidateQueries({
        queryKey: hemiEarnTermsAcceptanceKeyPrefix,
      })
    },
  })

  return { ...mutation, failure, termsChanged }
}
