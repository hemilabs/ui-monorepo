import { hemi } from 'hemi-viem'
import { useAccount, useBytecode } from 'wagmi'

import { isSmartContractAccount, resolveTermsStep } from '../_utils/termsGate'

import { useHemiEarnTerms } from './useHemiEarnTerms'
import { useHemiEarnTermsAcceptance } from './useHemiEarnTermsAcceptance'

export const useTermsStep = function () {
  const { address } = useAccount()
  const {
    data: terms,
    isError: isTermsError,
    isFetching: isTermsFetching,
  } = useHemiEarnTerms()
  const {
    data: acceptedVersion,
    isError: isAcceptanceError,
    isFetching: isAcceptanceFetching,
  } = useHemiEarnTermsAcceptance()
  const {
    data: code,
    isError: isCodeError,
    isSuccess: isCodeKnown,
  } = useBytecode({ address, chainId: hemi.id })

  const isError = isAcceptanceError || isCodeError || isTermsError
  const isReading = isAcceptanceFetching || isTermsFetching

  if (isError || !terms || acceptedVersion === undefined || !isCodeKnown) {
    return { isError, step: undefined, terms }
  }

  const step = resolveTermsStep({
    acceptedVersion,
    hasContractCode: isSmartContractAccount(code),
    termsVersion: terms.termsVersion,
  })

  if (step === 'accepted' && isReading) {
    return { isError, step: undefined, terms }
  }

  return { isError, step, terms }
}
