import { type Locale } from 'i18n/routing'
import { useLocale } from 'next-intl'
import { type ComponentProps, startTransition, useMemo } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router'
import { type Href, toLocation } from 'utils/url'

type NavigateOptions = {
  locale?: Locale
}

const withLocale = function (href: Href, locale: string) {
  const { hash, pathname, search } = toLocation(href)
  return { hash, pathname: `/${locale}${pathname}`, search }
}

export const usePathname = function () {
  const locale = useLocale()
  const { pathname } = useLocation()
  const prefix = `/${locale}`

  if (pathname === prefix) {
    return '/'
  }
  return pathname.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname
}

export const useRouter = function () {
  const locale = useLocale()
  const navigate = useNavigate()

  // Memoized because call sites put the router in `useEffect` dependency
  // arrays, where a fresh object every render re-runs the redirect forever.
  return useMemo(
    () => ({
      back: () => navigate(-1),
      // In a transition, so switching locale keeps the current screen up while
      // the new messages chunk loads instead of blanking to the Suspense
      // fallback the whole app sits under.
      push: (href: Href, options?: NavigateOptions) =>
        startTransition(() =>
          navigate(withLocale(href, options?.locale ?? locale)),
        ),
      replace: (href: Href, options?: NavigateOptions) =>
        startTransition(() =>
          navigate(withLocale(href, options?.locale ?? locale), {
            replace: true,
          }),
        ),
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
