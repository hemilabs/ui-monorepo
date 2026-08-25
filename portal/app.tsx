import { LocaleLayout } from 'app/[locale]/layout'
import NotFound from 'app/[locale]/not-found'
import { TunnelLayout } from 'app/[locale]/tunnel/layout'
import TunnelPage from 'app/[locale]/tunnel/page'
import TransactionHistoryPage from 'app/[locale]/tunnel/transaction-history/page'
import { UntranslatedError500 } from 'components/error500'
import { ErrorBoundary } from 'components/errorBoundary'
import { resolveLocale } from 'i18n/routing'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router'

const ToPreferredLocale = function () {
  const { search } = useLocation()

  return (
    <Navigate
      replace
      to={{ pathname: `/${resolveLocale(navigator.language)}`, search }}
    />
  )
}

export const App = () => (
  <ErrorBoundary
    // A hard reload rather than the boundary's reset: whatever threw here is
    // above the router, so re-rendering the same tree would just throw again.
    fallback={
      <UntranslatedError500 reset={() => window.location.replace('/')} />
    }
  >
    <BrowserRouter>
      <NuqsAdapter>
        <Routes>
          <Route element={<ToPreferredLocale />} path="/" />
          <Route element={<LocaleLayout />} path="/:locale">
            <Route element={<Navigate replace to="tunnel" />} index />
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
