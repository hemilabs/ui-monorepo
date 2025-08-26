import { useHemiToken } from 'hooks/useHemiToken'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import ConfettiExplosion from 'react-confetti-explosion'
import useSessionStorageState from 'use-session-storage-state'
import { useAccount } from 'wagmi'

const Icon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M8.00002 1.75C8.14809 1.7501 8.29282 1.79403 8.41596 1.87624C8.53911 1.95846 8.63516 2.07529 8.69202 2.212L10.102 5.605L13.766 5.898C13.9137 5.90988 14.0545 5.9652 14.1707 6.05699C14.2869 6.14878 14.3734 6.27293 14.4192 6.41379C14.4649 6.55464 14.468 6.7059 14.4279 6.84849C14.3879 6.99108 14.3065 7.11861 14.194 7.215L11.403 9.605L12.256 13.18C12.2903 13.324 12.2812 13.475 12.2298 13.6138C12.1784 13.7527 12.0871 13.8733 11.9673 13.9603C11.8476 14.0473 11.7047 14.097 11.5568 14.103C11.4088 14.109 11.2624 14.0711 11.136 13.994L7.99802 12.08L4.86302 13.995C4.7366 14.0721 4.5902 14.11 4.44227 14.104C4.29433 14.098 4.15148 14.0483 4.03172 13.9613C3.91195 13.8743 3.82063 13.7537 3.76925 13.6149C3.71788 13.476 3.70875 13.325 3.74302 13.181L4.59502 9.607L1.80502 7.217C1.69227 7.12074 1.61058 6.99323 1.57026 6.85056C1.52994 6.7079 1.53281 6.55648 1.5785 6.41545C1.62419 6.27441 1.71066 6.15008 1.82698 6.05816C1.94329 5.96624 2.08424 5.91086 2.23202 5.899L5.89502 5.606L7.30502 2.213C7.36192 2.07563 7.45837 1.95826 7.58212 1.87582C7.70587 1.79338 7.85133 1.74959 8.00002 1.75Z"
      fill="#FF6C15"
      fillRule="evenodd"
    />
  </svg>
)

function usePageVisitTracker() {
  const { address } = useAccount()
  const pathname = usePathnameWithoutLocale()

  // Using session-storage and not local-storage because here the idea is that
  // confetti should be rendered again in the next session, but not when navigating
  // through the page multiple times.
  const [hasVisited, setHasVisited] = useSessionStorageState(
    `portal.visited-eligible-page-${address.toLowerCase()}`,
    {
      defaultValue: false,
    },
  )

  useEffect(
    // marks the page as "visited" when the component unmounts
    // Note it doesn't work as expected on local development due to effects running twice
    // See https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development
    function markAsVisited() {
      if (hasVisited) {
        return undefined
      }

      return function cleanup() {
        if (!hasVisited) {
          setHasVisited(true)
        }
      }
    },
    [hasVisited, pathname, setHasVisited],
  )

  return hasVisited
}

export const ComeBackLater = function () {
  const hemiToken = useHemiToken()
  const hasVisited = usePageVisitTracker()
  const t = useTranslations('genesis-drop')

  return (
    <>
      <div className="mt-11 flex items-center gap-x-1 rounded-lg bg-orange-50 p-4">
        <Icon />
        <p className="text-sm font-medium text-orange-500">
          {t('come-back-later', { symbol: hemiToken.symbol })}
        </p>
      </div>
      {!hasVisited && (
        <ConfettiExplosion
          duration={3000}
          force={0.8}
          particleCount={250}
          width={1600}
        />
      )}
    </>
  )
}
