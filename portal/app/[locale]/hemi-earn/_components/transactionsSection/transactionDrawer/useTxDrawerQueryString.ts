import { parseAsString, useQueryState } from 'nuqs'

export const useTxDrawerQueryString = () =>
  useQueryState('earnTxId', parseAsString.withOptions({ clearOnDefault: true }))
