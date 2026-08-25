import { type Locale } from './routing'

type Messages = typeof import('../messages/en.json')

const pending = new Map<Locale, Promise<Messages>>()

// Cached because `use()` re-reads the promise on every render, and a fresh
// import() each time would suspend forever.
export const getMessages = function (locale: Locale) {
  const cached = pending.get(locale)
  if (cached) {
    return cached
  }

  const loading = import(`../messages/${locale}.json`).then(
    module => module.default as Messages,
  )
  // Drop a rejected load, otherwise the cache replays the failure forever and
  // the error page's retry can never recover.
  loading.catch(function forgetFailedLoad() {
    pending.delete(locale)
  })
  pending.set(locale, loading)
  return loading
}
