import { isAddress, isAddressEqual, zeroAddress, type Address } from 'viem'

const isEpoch = (epoch: number) => Number.isSafeInteger(epoch) && epoch >= 0

export const validateClaimFromInputs = function ({
  account,
  fromEpoch,
  toEpoch,
  tokenId,
  tokenStart,
}: {
  account: Address
  fromEpoch: number
  toEpoch: number
  tokenId: bigint
  tokenStart: bigint
}) {
  if (!isAddress(account) || isAddressEqual(account, zeroAddress)) {
    return 'account is not a valid address'
  }
  if (tokenId <= BigInt(0)) {
    return 'tokenId is not valid'
  }
  if (!isEpoch(fromEpoch) || !isEpoch(toEpoch)) {
    return 'epoch is not valid'
  }
  if (fromEpoch > toEpoch) {
    return 'epoch range is not valid'
  }
  if (tokenStart < BigInt(0)) {
    return 'tokenStart is not valid'
  }
  return undefined
}

export const validateClaimTokenInputs = function ({
  account,
  fromEpoch,
  toEpoch,
  token,
  tokenId,
}: {
  account: Address
  fromEpoch: number
  toEpoch: number
  token: Address
  tokenId: bigint
}) {
  if (!isAddress(account) || isAddressEqual(account, zeroAddress)) {
    return 'account is not a valid address'
  }
  if (!isAddress(token) || isAddressEqual(token, zeroAddress)) {
    return 'token is not a valid address'
  }
  if (tokenId <= BigInt(0)) {
    return 'tokenId is not valid'
  }
  if (!isEpoch(fromEpoch) || !isEpoch(toEpoch)) {
    return 'epoch is not valid'
  }
  if (fromEpoch > toEpoch) {
    return 'epoch range is not valid'
  }
  return undefined
}

/**
 * The widest epoch range one claim can carry while still settling every reward token.
 *
 * A claim is bounded three ways and the binding one is the product: at most
 * `maxClaimPairs` epoch x token pairs. The contract narrows its token page to
 * `maxClaimPairs / span` as the range widens, so over the full `maxClaimEpochs` it
 * settles a single asset and the rest need a registry cursor, which a mined receipt
 * cannot carry. Narrowing the span instead keeps one claim whole.
 *
 * This is a proposal. What authorises a claim is simulating the exact call about to be
 * signed and requiring the returned cursor to be zero, which `claimFrom` does.
 */
export const getClaimSpan = ({
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
