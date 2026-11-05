import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

import {
  type UserShareValueParams,
  userShareValueOptions,
} from '../_fetchers/fetchUserShareValue'

export const useUserShareValue = function (
  params: Omit<UserShareValueParams, 'account' | 'queryClient'>,
) {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  return useQuery(
    userShareValueOptions({ ...params, account: address, queryClient }),
  )
}
