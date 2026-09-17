export type EpochClaimChunk = { from: number; to: number }

/**
 * The widest epoch span that still settles every registered asset in one call.
 *
 * `claim` is bounded three ways and the binding one is the product: at most
 * MAX_CLAIM_PAIRS epoch x token pairs. The contract shrinks its token page as the span
 * widens, so over the full MAX_CLAIM_EPOCHS it settles a single asset and the rest need
 * a registry cursor threaded through `claimFrom`. That cursor is a transaction return
 * value, which a mined receipt cannot carry - so we narrow the span instead of guessing.
 *
 * This is only a proposal; what authorises a claim is simulating the exact call about to
 * be signed and requiring the cursor back as 0. It lives here so anything else planning
 * a claim derives the span the same way.
 */
export const claimSpan = ({
  maxClaimEpochs,
  maxClaimPairs,
  tokenCount,
}: {
  maxClaimEpochs: number
  maxClaimPairs: number
  tokenCount: number
}) =>
  Math.max(
    1,
    Math.min(
      maxClaimEpochs,
      Math.floor(maxClaimPairs / Math.max(1, tokenCount)),
    ),
  )

export const chunksFor = function ({
  fromEpoch,
  span,
  toEpoch,
}: {
  fromEpoch: number
  span: number
  toEpoch: number
}) {
  const chunks: EpochClaimChunk[] = []
  for (let from = fromEpoch; from <= toEpoch; from += span) {
    chunks.push({ from, to: Math.min(from + span - 1, toEpoch) })
  }
  return chunks
}
