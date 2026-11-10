import { type Hex } from 'viem'

export type TermsStep =
  | 'accepted'
  | 'cannot-sign'
  | 'first-acceptance'
  | 're-acceptance'

const eip7702Prefix = '0xef0100'

export const isSmartContractAccount = (code: Hex | undefined) =>
  !!code && code !== '0x' && !code.startsWith(eip7702Prefix)

export type AcceptanceFailure =
  | 'invalid-signature'
  | 'not-signed'
  | 'terms-changed'
  | 'unexpected'

export const classifyAcceptanceFailure = function ({
  isUserRejection,
  status,
}: {
  isUserRejection: boolean
  status: number | undefined
}) {
  if (status === 409) {
    return 'terms-changed'
  }
  if (status === 401 || status === 422) {
    return 'invalid-signature'
  }
  if (isUserRejection) {
    return 'not-signed'
  }
  return 'unexpected'
}

export const resolveTermsStep = function ({
  acceptedVersion,
  hasContractCode,
  termsVersion,
}: {
  acceptedVersion: string | null
  hasContractCode: boolean
  termsVersion: string
}): TermsStep {
  if (acceptedVersion === termsVersion) {
    return 'accepted'
  }
  if (hasContractCode) {
    return 'cannot-sign'
  }
  if (acceptedVersion === null) {
    return 'first-acceptance'
  }
  return 're-acceptance'
}
