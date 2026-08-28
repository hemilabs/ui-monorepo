import * as Sentry from '@sentry/react'
import { EcosystemLayout } from 'app/[locale]/ecosystem/layout'
import { EcosystemPage } from 'app/[locale]/ecosystem/page'
import { GenesisDropLayout } from 'app/[locale]/genesis-drop/layout'
import { GenesisDropPage } from 'app/[locale]/genesis-drop/page'
import { GetStartedLayout } from 'app/[locale]/get-started/layout'
import { GetStartedPage } from 'app/[locale]/get-started/page'
import { HemiEarnLayout } from 'app/[locale]/hemi-earn/layout'
import { HemiEarnPage } from 'app/[locale]/hemi-earn/page'
import { PoolPage } from 'app/[locale]/hemi-earn/pool/[shareAddress]/page'
import { LocaleLayout } from 'app/[locale]/layout'
import { NotFound } from 'app/[locale]/not-found'
import { StakeDashboardPage } from 'app/[locale]/stake/dashboard/page'
import { StakeLayout } from 'app/[locale]/stake/layout'
import { StakePage } from 'app/[locale]/stake/page'
import { StakingDashboardLayout } from 'app/[locale]/staking-dashboard/layout'
import { StakingDashboardPage } from 'app/[locale]/staking-dashboard/page'
import { TunnelLayout } from 'app/[locale]/tunnel/layout'
import { TunnelPage } from 'app/[locale]/tunnel/page'
import { TransactionHistoryPage } from 'app/[locale]/tunnel/transaction-history/page'
import { featureFlags } from 'app/featureFlags'
import { UntranslatedError500 } from 'components/error500'
import { ErrorBoundary } from 'components/errorBoundary'
import { preferredLocale } from 'i18n/routing'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router'

// Without this the route tree never reaches Sentry, and every transaction is
// named after the raw pathname instead of the pattern it matched.
const SentryRoutes = Sentry.wrapReactRouterRouting(Routes)

// The two entry paths that do not simply gain a locale: `/stake` pointed at the
// dashboard, and the folder shipped misspelled. Everything else is handled by
// the fallback in the locale layout.
const pathAliases = {
  '/stake': '/stake/dashboard',
  '/staking-dashbord': '/staking-dashboard',
}

const ToPreferredLocale = function ({ path = '' }: { path?: string }) {
  const { hash, search } = useLocation()

  return (
    <Navigate
      replace
      to={{ hash, pathname: `/${preferredLocale()}${path}`, search }}
    />
  )
}

const ToTunnel = function () {
  const { hash, pathname, search } = useLocation()

  return (
    <Navigate
      replace
      to={{ hash, pathname: `${pathname.replace(/\/+$/, '')}/tunnel`, search }}
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
        <SentryRoutes>
          <Route
            element={
              <ToPreferredLocale
                path={featureFlags.enableHemiEarnPage ? '/hemi-earn' : ''}
              />
            }
            path="/"
          />
          {Object.entries(pathAliases).map(([from, to]) => (
            <Route
              element={<ToPreferredLocale path={to} />}
              key={from}
              path={from}
            />
          ))}
          <Route element={<LocaleLayout />} path="/:locale">
            <Route element={<ToTunnel />} index />
            <Route element={<TunnelLayout />} path="tunnel">
              <Route element={<TunnelPage />} index />
              <Route
                element={<TransactionHistoryPage />}
                path="transaction-history"
              />
            </Route>
            <Route element={<EcosystemLayout />} path="ecosystem">
              <Route element={<EcosystemPage />} index />
            </Route>
            <Route element={<ToEcosystem />} path="demos" />
            <Route element={<GenesisDropLayout />} path="genesis-drop">
              <Route element={<GenesisDropPage />} index />
            </Route>
            <Route element={<GetStartedLayout />} path="get-started">
              <Route element={<GetStartedPage />} index />
            </Route>
            <Route element={<HemiEarnLayout />} path="hemi-earn">
              <Route element={<HemiEarnPage />} index />
              <Route element={<PoolPage />} path="pool/:shareAddress" />
            </Route>
            <Route element={<StakeLayout />} path="stake">
              <Route element={<StakePage />} index />
              <Route element={<StakeDashboardPage />} path="dashboard" />
            </Route>
            <Route
              element={<StakingDashboardLayout />}
              path="staking-dashboard"
            >
              <Route element={<StakingDashboardPage />} index />
            </Route>
            <Route element={<NotFound />} path="*" />
          </Route>
        </SentryRoutes>
      </NuqsAdapter>
    </BrowserRouter>
  </ErrorBoundary>
)
