type QueryStatus = 'error' | 'pending' | 'success'

// From `status`, not `isLoading`: a disabled query is pending but not fetching.
export const getRewardTokensStatus = ({
  addressesStatus,
  tokenStatuses,
}: {
  addressesStatus: QueryStatus
  tokenStatuses: QueryStatus[]
}) => ({
  hasError:
    addressesStatus === 'error' ||
    tokenStatuses.some(status => status === 'error'),
  isPending:
    addressesStatus === 'pending' ||
    tokenStatuses.some(status => status === 'pending'),
})
