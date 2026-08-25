import { type Locale } from 'i18n/routing'
import { useLocale } from 'next-intl'
import { type ComponentProps, startTransition, useMemo } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router'
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
      // In a transition so a suspending destination keeps the current screen
      // up: the Suspense around the Outlet has no fallback, so committing it
      // would blank the content area.
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
