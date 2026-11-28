import fetchPlusPlus from 'fetch-plus-plus'
import { type Hex, type TypedDataDomain } from 'viem'

export const hemiEarnTermsKeyPrefix = ['hemi-earn', 'terms'] as const

export type HemiEarnTerms = {
  domain: TypedDataDomain
  primaryType: string
  statement: string
  termsHash: Hex
  termsUrl: string
  termsVersion: string
  types: Record<string, { name: string; type: string }[]>
}

export const fetchHemiEarnTerms = async function (apiUrl: string) {
  const terms = (await fetchPlusPlus(`${apiUrl}/hemi-earn/terms`, {
    cache: 'no-store',
    method: 'GET',
  })) as Partial<HemiEarnTerms>
  if (terms.termsVersion === undefined) {
    throw new Error('Hemi Earn terms response is missing termsVersion')
  }
  return terms as HemiEarnTerms
}
