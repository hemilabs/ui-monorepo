import * as Sentry from '@sentry/react'
import { EcosystemLayout } from 'app/[locale]/ecosystem/layout'
import { EcosystemPage } from 'app/[locale]/ecosystem/page'
import { GetStartedLayout } from 'app/[locale]/get-started/layout'
import { GetStartedPage } from 'app/[locale]/get-started/page'
import { HemiEarnLayout } from 'app/[locale]/hemi-earn/layout'
import { HemiEarnPage } from 'app/[locale]/hemi-earn/page'
import { VaultPage } from 'app/[locale]/hemi-earn/vault/[shareAddress]/page'
import { HemiStakeAnalyticsPage } from 'app/[locale]/hemi-stake/analytics/page'
import { HemiStakeLayout } from 'app/[locale]/hemi-stake/layout'
import { HemiStakePage } from 'app/[locale]/hemi-stake/page'
import { LocaleLayout } from 'app/[locale]/layout'
import { NotFound } from 'app/[locale]/not-found'
import { StakeDashboardPage } from 'app/[locale]/stake/dashboard/page'
import { StakeLayout } from 'app/[locale]/stake/layout'
import { StakePage } from 'app/[locale]/stake/page'
import { TunnelLayout } from 'app/[locale]/tunnel/layout'
import { TunnelPage } from 'app/[locale]/tunnel/page'
import { TransactionHistoryPage } from 'app/[locale]/tunnel/transaction-history/page'
import { UntranslatedError500 } from 'components/error500'
import { ErrorBoundary } from 'components/errorBoundary'
import { preferredLocale } from 'i18n/routing'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { type ReactElement } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import { landingPage } from 'utils/landingPage'
import { type RouteDefinition, type RouteId, routes } from 'utils/routes'

// Without this the route tree never reaches Sentry, and every transaction is
// named after the raw pathname instead of the pattern it matched.
const SentryRoutes = Sentry.wrapReactRouterRouting(Routes)

const ToPreferredLocale = function ({ path }: { path: string }) {
  const { hash, search } = useLocation()

  return (
    <Navigate
      replace
      to={{ hash, pathname: `/${preferredLocale()}${path}`, search }}
    />
  )
}

const ToLandingPage = function () {
  const { hash, pathname, search } = useLocation()

  return (
    <Navigate
      replace
      to={{
        hash,
        pathname: `${pathname.replace(/\/+$/, '')}${landingPage}`,
        search,
      }}
    />
  )
}

const ToHemiStake = function () {
  const { hash, pathname, search } = useLocation()

  return (
    <Navigate
      replace
      to={{
        hash,
        pathname: pathname.replace(/\/staking-dashboard\/?$/, '/hemi-stake'),
        search,
      }}
    />
  )
}

const ToEcosystem = function () {
  const { hash, pathname, search } = useLocation()

  return (
    <Navigate
      replace
      to={{
        hash,
        pathname: pathname.replace(/\/demos\/?$/, '/ecosystem'),
        search,
      }}
    />
  )
}

// A Record, so a route added to utils/routes.ts without an element fails typecheck.
const elements: Record<RouteId, ReactElement> = {
  demosRedirect: <ToEcosystem />,
  ecosystemLayout: <EcosystemLayout />,
  ecosystemPage: <EcosystemPage />,
  getStartedLayout: <GetStartedLayout />,
  getStartedPage: <GetStartedPage />,
  hemiEarnLayout: <HemiEarnLayout />,
  hemiEarnPage: <HemiEarnPage />,
  hemiStakeAnalyticsPage: <HemiStakeAnalyticsPage />,
  hemiStakeLayout: <HemiStakeLayout />,
  hemiStakePage: <HemiStakePage />,
  hemiStakeRedirect: <ToHemiStake />,
  landingRedirect: <ToLandingPage />,
  localeLayout: <LocaleLayout />,
  notFound: <NotFound />,
  rootRedirect: <ToPreferredLocale path={landingPage} />,
  stakeDashboardPage: <StakeDashboardPage />,
  stakeLayout: <StakeLayout />,
  stakePage: <StakePage />,
  stakeRedirect: <ToPreferredLocale path="/stake/dashboard" />,
  stakingDashboardRedirect: <ToPreferredLocale path="/hemi-stake" />,
  transactionHistoryPage: <TransactionHistoryPage />,
  tunnelLayout: <TunnelLayout />,
  tunnelPage: <TunnelPage />,
  vaultPage: <VaultPage />,
}

const renderRoutes = (definitions: readonly RouteDefinition[]) =>
  definitions.map(({ children, id, index, path }) =>
    index ? (
      <Route element={elements[id as RouteId]} index key={id} />
    ) : (
      <Route element={elements[id as RouteId]} key={id} path={path}>
        {children && renderRoutes(children)}
      </Route>
    ),
  )

export const App = () => (
  // Outermost on purpose: anything thrown above this, including reading the
  // browser language, would take the whole page down with nothing to show.
  <ErrorBoundary
    // A hard reload rather than the boundary's reset: whatever threw here is
    // above the router, so re-rendering the same tree would throw again.
    // Sized here because this renders straight into #root, outside the app
    // layout that would otherwise give the centering something to work with.
    fallback={
      <div className="h-dvh">
        <UntranslatedError500 reset={() => window.location.replace('/')} />
      </div>
    }
  >
    <BrowserRouter>
      <NuqsAdapter>
        <SentryRoutes>{renderRoutes(routes)}</SentryRoutes>
      </NuqsAdapter>
    </BrowserRouter>
  </ErrorBoundary>
)
