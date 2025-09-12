import { parseAsInteger, useQueryState } from 'nuqs'

export const useSelectedClaimGroup = () =>
  useQueryState('claimGroupId', parseAsInteger)
