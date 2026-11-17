// The action reports every reason through a single `failed-validation` event. Only a lock
// that no longer matches the snapshot means the data went stale and the form has to be
// shown again; a read that failed is a hiccup, and sending the user back to the form would
// make the click look like a no-op (#2474).
const transientReasons = new Set([
  'failed to check lock status',
  'failed to validate inputs',
])

export const isTransientLockFailure = (reason: string) =>
  transientReasons.has(reason)
