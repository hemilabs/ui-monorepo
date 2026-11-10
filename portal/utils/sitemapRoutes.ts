import { type RouteDefinition, routes } from './routes.ts'

type FeatureFlag = NonNullable<RouteDefinition['featureFlag']>

const join = (parent: string, path: string) =>
  [parent, path].filter(Boolean).join('/')

const collect = (
  definitions: readonly RouteDefinition[],
  parent: string,
  flags: Record<FeatureFlag, boolean>,
): string[] =>
  definitions
    .filter(
      ({ featureFlag, redirect }) =>
        !redirect && (!featureFlag || flags[featureFlag]),
    )
    .flatMap(({ children, index, path = '' }) =>
      children
        ? collect(children, join(parent, path), flags)
        : [index ? parent : join(parent, path)],
    )

export const sitemapRoutes = function (
  includeHemiEarn: boolean,
  definitions: readonly RouteDefinition[] = routes,
) {
  const locale = definitions.find(({ path }) => path === '/:locale')
  return [
    ...new Set(
      collect(locale?.children ?? [], '', { hemiEarn: includeHemiEarn })
        .filter(path => path && !/[:*]/.test(path))
        .map(path => `/${path}`),
    ),
  ].sort()
}
