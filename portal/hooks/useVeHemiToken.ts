import { useHemiToken } from 'hooks/useHemiToken'
import { useToken } from 'hooks/useToken'
import { useMemo } from 'react'
import { type Token } from 'types/token'
import { getVeHemiContractAddress } from 've-hemi-actions'

import { useHemi } from './useHemi'

export const useVeHemiToken = function () {
  const chainId = useHemi().id
  const veHemiAddress = getVeHemiContractAddress(chainId)
  const hemiToken = useHemiToken()
  const query = useToken({
    address: veHemiAddress,
    chainId,
  })

  const data = useMemo(
    (): Token | undefined =>
      query.data
        ? {
            ...query.data,
            extensions: {
              ...query.data.extensions,
              l1LogoURI:
                query.data.extensions?.l1LogoURI ??
                hemiToken.extensions?.l1LogoURI,
            },
            logoURI: query.data.logoURI ?? hemiToken.logoURI,
          }
        : undefined,
    [hemiToken.extensions?.l1LogoURI, hemiToken.logoURI, query.data],
  )

  return { ...query, data }
}
