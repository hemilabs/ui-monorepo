import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

/**
 * Hook that returns the pathname without the locale. Useful for relative links
 * where you want to update the current pathname, without changing the locale
 * (for example, adding a particular query string).
 * @returns The full pathname without the locale
 */
export const usePathnameWithoutLocale = function () {
  const locale = useLocale()
  // replace only replaces the first match, which should always be at the beginning
  return usePathname().replace(`/${locale}`, '')
}
