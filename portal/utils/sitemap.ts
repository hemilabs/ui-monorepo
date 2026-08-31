import { type Locale } from 'i18n/routing'

type Params = {
  baseUrl: string
  locales: readonly Locale[]
  routes: readonly string[]
}

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    character =>
      ({
        '"': '&quot;',
        '&': '&amp;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;',
      })[character]!,
  )

const toUrl = ({
  baseUrl,
  locale,
  route,
}: {
  baseUrl: string
  locale: Locale
  route: string
}) => escapeXml(`${baseUrl.replace(/\/+$/, '')}/${locale}${route}`)

export const buildSitemap = function ({ baseUrl, locales, routes }: Params) {
  const entries = routes.flatMap(route =>
    locales.map(function (locale) {
      const alternates = locales
        .map(
          alternate =>
            `    <xhtml:link rel="alternate" hreflang="${alternate}" href="${toUrl({ baseUrl, locale: alternate, route })}" />`,
        )
        .join('\n')

      return `  <url>\n    <loc>${toUrl({ baseUrl, locale, route })}</loc>\n${alternates}\n  </url>`
    }),
  )

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`
}
