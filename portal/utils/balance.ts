import { type FetchStatus, type QueryStatus } from '@tanstack/react-query'

// A disabled query (e.g. no wallet connected) stays 'pending' + 'idle' and never resolves.
export const isBalanceUnavailable = ({
  fetchStatus,
  status,
}: {
  fetchStatus?: FetchStatus
  status: QueryStatus
}) => status === 'error' || fetchStatus === 'idle'
