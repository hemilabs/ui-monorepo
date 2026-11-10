import { hemi } from 'hemi-viem'
import { useAccount, useBytecode } from 'wagmi'

import { isSmartContractAccount, resolveTermsStep } from '../_utils/termsGate'

import { useHemiEarnTerms } from './useHemiEarnTerms'
import { useHemiEarnTermsAcceptance } from './useHemiEarnTermsAcceptance'

export const useTermsStep = function () {
  const { address } = useAccount()
  const { data: terms, isError: isTermsError } = useHemiEarnTerms()
  const { data: acceptedVersion, isError: isAcceptanceError } =
    useHemiEarnTermsAcceptance()
  const {
    data: code,
    isError: isCodeError,
    isSuccess: isCodeKnown,
  } = useBytecode({ address, chainId: hemi.id })

  if (terms && acceptedVersion !== undefined && isCodeKnown) {
    return {
      isError: false,
      step: resolveTermsStep({
        acceptedVersion,
        hasContractCode: isSmartContractAccount(code),
        termsVersion: terms.termsVersion,
      }),
      terms,
    }
  }

  return {
    isError: isAcceptanceError || isCodeError || isTermsError,
    step: undefined,
    terms,
  }
}
