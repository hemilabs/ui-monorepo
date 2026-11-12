import fetchPlusPlus from 'fetch-plus-plus'
import { type Address, type Hex } from 'viem'

export const postHemiEarnTermsAcceptance = async function ({
  account,
  apiUrl,
  issuedAt,
  signature,
  termsVersion,
}: {
  account: Address
  apiUrl: string
  issuedAt: number
  signature: Hex
  termsVersion: string
}) {
  const acceptance = (await fetchPlusPlus(
    `${apiUrl}/hemi-earn/terms/acceptance`,
    {
      body: JSON.stringify({ account, issuedAt, signature, termsVersion }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  )) as { acceptedVersion: string | undefined }

  if (acceptance.acceptedVersion === undefined) {
    throw new Error(
      'Hemi Earn terms acceptance response is missing acceptedVersion',
    )
  }
  return acceptance.acceptedVersion
}
