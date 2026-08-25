import { LocaleLayout } from 'app/[locale]/layout'
import NotFound from 'app/[locale]/not-found'
import { TunnelLayout } from 'app/[locale]/tunnel/layout'
import TunnelPage from 'app/[locale]/tunnel/page'
import TransactionHistoryPage from 'app/[locale]/tunnel/transaction-history/page'
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

const ToPreferredLocale = function () {
  const { hash, search } = useLocation()

  return (
    <Navigate
      replace
      to={{ hash, pathname: `/${preferredLocale()}`, search }}
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
        <Routes>
          <Route element={<ToPreferredLocale />} path="/" />
          <Route element={<LocaleLayout />} path="/:locale">
            <Route element={<ToTunnel />} index />
            <Route element={<TunnelLayout />} path="tunnel">
              <Route element={<TunnelPage />} index />
              <Route
                element={<TransactionHistoryPage />}
                path="transaction-history"
              />
            </Route>
            <Route element={<NotFound />} path="*" />
          </Route>
        </Routes>
      </NuqsAdapter>
    </BrowserRouter>
  </ErrorBoundary>
)
