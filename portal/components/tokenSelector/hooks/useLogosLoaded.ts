import { useQueries } from '@tanstack/react-query'
import { type Token } from 'types/token'

const maxLogoWaitMs = 3000

const preloadImage = (src: string) =>
  new Promise<string>(function (resolve) {
    const image = new window.Image()
    image.onerror = () => resolve(src)
    image.onload = () => resolve(src)
    image.src = src
    setTimeout(() => resolve(src), maxLogoWaitMs)
  })

export const useLogosLoaded = (tokens: Token[]) =>
  useQueries({
    combine: results => results.every(({ isSuccess }) => isSuccess),
    queries: tokens
      .flatMap(({ logoURI }) => (logoURI ? [logoURI] : []))
      .map(src => ({
        queryFn: () => preloadImage(src),
        queryKey: ['token-logo', src],
        staleTime: Infinity,
      })),
  })
