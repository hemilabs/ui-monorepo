import fs from 'fs'
import { Locale, locales } from 'i18n/routing'
import type { MetadataRoute } from 'next'
import path from 'path'

const getBaseUrl = () =>
  process.env.HEMI_DOMAIN
    ? `https://app.${process.env.HEMI_DOMAIN}`
    : 'http://localhost:3000'

/**
 * Recursively finds all route paths in the Next.js app directory,
 * ignoring the [locale] folder and only including folders with a page.{js,ts,tsx} file.
 * Returns an array of route strings (relative to the app directory, starting with '/').
 */
function getAppRoutes(appDir: string, baseRoute = ''): string[] {
  const entries = fs.readdirSync(appDir, { withFileTypes: true })
  let routes: string[] = []

  const hasPageFile = entries.some(
    entry => entry.isFile() && /^page\.(js|ts|tsx)$/.test(entry.name),
  )

  if (hasPageFile && baseRoute && !baseRoute.endsWith('demos')) {
    routes.push(baseRoute || '/')
  }

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== '[locale]') {
      const childRoutes = getAppRoutes(
        path.join(appDir, entry.name),
        path.join(baseRoute, entry.name),
      )
      routes = routes.concat(childRoutes)
    }
  }

  return routes
}

const getUrl = (locale: Locale, route: string) =>
  `${getBaseUrl()}/${locale}/${route}`

/**
 * Generates a sitemap for the Next.js app. Only pages that serve content should be listed.
 * Pages that redirect should be excluded.
 */
const sitemap = (): MetadataRoute.Sitemap =>
  getAppRoutes(path.join(path.resolve(), 'app/[locale]')).flatMap(route =>
    locales.map(locale => ({
      alternates: {
        // Alternates should include the current locale as well
        languages: Object.fromEntries(locales.map(l => [l, getUrl(l, route)])),
      },
      lastModified: new Date(),
      url: getUrl(locale, route),
    })),
  )

export default sitemap
