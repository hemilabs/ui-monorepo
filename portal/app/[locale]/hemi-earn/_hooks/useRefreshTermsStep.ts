import { useQueryClient } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { useNetworkType } from 'hooks/useNetworkType'
import { useRef } from 'react'
import { useAccount, useBytecode } from 'wagmi'

import { isSmartContractAccount, resolveTermsStep } from '../_utils/termsGate'

import { hemiEarnTermsQueryOptions } from './useHemiEarnTerms'
import { hemiEarnTermsAcceptanceQueryOptions } from './useHemiEarnTermsAcceptance'

export const useRefreshTermsStep = function () {
  const { address } = useAccount()
  const [networkType] = useNetworkType()
  const queryClient = useQueryClient()
  const { data: code } = useBytecode({ address, chainId: hemi.id })
  const connected = useRef(address)
  connected.current = address

  return async function refreshTermsStep() {
    const account = address
    const [terms, acceptedVersion] = await Promise.all([
      queryClient.fetchQuery(hemiEarnTermsQueryOptions(networkType)),
      queryClient.fetchQuery(
        hemiEarnTermsAcceptanceQueryOptions({ account, networkType }),
      ),
    ])

    if (connected.current !== account) {
      return undefined
    }

    return resolveTermsStep({
      acceptedVersion,
      hasContractCode: isSmartContractAccount(code),
      termsVersion: terms.termsVersion,
    })
  }
}
