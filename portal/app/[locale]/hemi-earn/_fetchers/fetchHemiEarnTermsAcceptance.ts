import fetchPlusPlus from 'fetch-plus-plus'
import { type Address } from 'viem'

export const hemiEarnTermsAcceptanceKeyPrefix = [
  'hemi-earn',
  'terms-acceptance',
] as const

const neverAccepted = { acceptedVersion: null }

export const fetchHemiEarnTermsAcceptance = async function ({
  account,
  apiUrl,
}: {
  account: Address
  apiUrl: string
}) {
  const acceptance = (await fetchPlusPlus(
    `${apiUrl}/hemi-earn/terms/acceptance/${account}`,
    { cache: 'no-store', method: 'GET' },
  ).catch(function (error: { status?: number }) {
    if (error.status === 404) {
      return neverAccepted
    }
    throw error
  })) as { acceptedVersion: string | null | undefined }

  if (acceptance.acceptedVersion === undefined) {
    throw new Error(
      'Hemi Earn terms acceptance response is missing acceptedVersion',
    )
  }
  return acceptance.acceptedVersion
}
