import { useQueryClient } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount, useBytecode, useConfig } from 'wagmi'
import { getAccount } from 'wagmi/actions'

import { isSmartContractAccount, resolveTermsStep } from '../_utils/termsGate'

import { hemiEarnTermsQueryOptions } from './useHemiEarnTerms'
import { hemiEarnTermsAcceptanceQueryOptions } from './useHemiEarnTermsAcceptance'

export const useRefreshTermsStep = function () {
  const { address } = useAccount()
  const [networkType] = useNetworkType()
  const queryClient = useQueryClient()
  const { data: code } = useBytecode({ address, chainId: hemi.id })
  const config = useConfig()

  return async function refreshTermsStep() {
    const account = address
    const [terms, acceptedVersion] = await Promise.all([
      queryClient.fetchQuery(hemiEarnTermsQueryOptions(networkType)),
      queryClient.fetchQuery(
        hemiEarnTermsAcceptanceQueryOptions({ account, networkType }),
      ),
    ])

    if (getAccount(config).address !== account) {
      return undefined
    }

    return resolveTermsStep({
      acceptedVersion,
      hasContractCode: isSmartContractAccount(code),
      termsVersion: terms.termsVersion,
    })
  }
}
