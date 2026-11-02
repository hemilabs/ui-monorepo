import { hemiEarnLinks } from '@vetro-protocol/earn/hemiEarn'
import { isValidUrl } from 'utils/url'

export const vetroApiUrl = import.meta.env.VITE_VETRO_API_URL
export const isVetroApiConfigured =
  vetroApiUrl !== undefined && isValidUrl(vetroApiUrl)

export const vetroPrivacyPolicyUrl = hemiEarnLinks.privacyPolicyUrl
export const vetroSupportUrl = hemiEarnLinks.supportUrl
export const vetroTermsUrl = hemiEarnLinks.termsOfUseUrl
