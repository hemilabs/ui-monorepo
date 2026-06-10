import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

import {
  type UserShareValueParams,
  userShareValueOptions,
} from '../_fetchers/fetchUserShareValue'

export const useUserShareValue = function (
  params: Omit<UserShareValueParams, 'account'>,
) {
  const { address } = useAccount()
  return useQuery(userShareValueOptions({ ...params, account: address }))
}
