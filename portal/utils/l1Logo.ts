import { type Token } from 'types/token'

const logosUrl = 'https://hemilabs.github.io/token-list/logos/'
const l1LogosUrl = 'https://hemilabs.github.io/token-list/l1Logos/'

// The token list hosts an L1 version (without the Hemi badge) of each of its logos
export const getL1LogoURI = ({ logoURI }: Pick<Token, 'logoURI'>) =>
  logoURI?.startsWith(logosUrl)
    ? `${l1LogosUrl}${logoURI.slice(logosUrl.length)}`
    : undefined
