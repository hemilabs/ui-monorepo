import { type Locale } from 'i18n/routing'
import { type ComponentProps, useMemo } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router'
import { useLocale } from 'use-intl'
import { type Href, toLocation, unlocalizedPathname } from 'utils/url'

type NavigateOptions = {
  locale?: Locale
}

const withLocale = function (href: Href, locale: Locale) {
  const { hash, pathname, search } = toLocation(href)
  return { hash, pathname: `/${locale}${pathname}`, search }
}

export const usePathname = function () {
  const locale = useLocale()
  const { pathname } = useLocation()

  return unlocalizedPathname(pathname, locale)
}

export const useRouter = function () {
  const locale = useLocale()
  const navigate = useNavigate()

  // Memoized because call sites put the router in `useEffect` dependency
  // arrays, where a fresh object every render re-runs the redirect forever.
  return useMemo(
    () => ({
      back: () => navigate(-1),
      push: (href: Href, options?: NavigateOptions) =>
        navigate(withLocale(href, options?.locale ?? locale)),
      replace: (href: Href, options?: NavigateOptions) =>
        navigate(withLocale(href, options?.locale ?? locale), {
          replace: true,
        }),
    }),
    [locale, navigate],
  )
}

type LinkProps = Omit<ComponentProps<typeof RouterLink>, 'to'> & {
  href: Href
}

export const Link = function ({ href, ...props }: LinkProps) {
  const locale = useLocale()
  return <RouterLink {...props} to={withLocale(href, locale)} />
}
