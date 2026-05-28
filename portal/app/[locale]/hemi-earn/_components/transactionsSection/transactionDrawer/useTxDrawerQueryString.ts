import { parseAsString, useQueryState } from 'nuqs'

// `?earnTxId=...` holds either an `initiateTxHash` (when the user clicks a
// row that already has it) or `inflight-{startedAt}` (when the row is a
// local-store entry that hasn't reached the deposit-tx step yet). The drawer
// resolves the entry in that order.
export const useTxDrawerQueryString = function () {
  const [txId, setTxId] = useQueryState(
    'earnTxId',
    parseAsString.withOptions({ clearOnDefault: true }),
  )

  const setTxDrawerQueryString = function (next: string | null) {
    setTxId(next)
  }

  return { setTxDrawerQueryString, txId }
}
