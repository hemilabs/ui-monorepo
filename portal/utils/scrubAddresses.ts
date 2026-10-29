import isPlainObject from 'lodash/isPlainObject'

const placeholder = '<address>'

// 0x + 40 hex chars, not followed by more hex, so tx hashes (0x + 64) are kept.
// No lookbehind is needed as "x" is not a hex char.
const evmAddressRegex = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g

// bech32 and bech32m addresses, for mainnet, testnet and regtest
const bech32AddressRegex =
  /(?<![0-9A-Za-z])(?:bc|tb|bcrt)1[02-9ac-hj-np-z]{25,87}(?![0-9A-Za-z])/gi

// P2PKH and P2SH addresses, for mainnet (1, 3) and testnet (m, n, 2)
const base58AddressRegex =
  /(?<![0-9A-Za-z])[123mn][1-9A-HJ-NP-Za-km-z]{25,34}(?![0-9A-Za-z])/g

const hexOnlyRegex = /^[0-9a-f]+$/i

// These hold SDK internals or stack frames, which never carry user addresses,
// and where a false positive would break symbolication.
const skippedKeys = ['debug_meta', 'sdkProcessingMetadata', 'stacktrace']

const scrubString = (value: string) =>
  value
    .replace(evmAddressRegex, placeholder)
    .replace(bech32AddressRegex, placeholder)
    // Sentry trace ids are 32 hex chars, which may also be valid base58, so
    // keep any match made only of hex chars.
    .replace(base58AddressRegex, match =>
      hexOnlyRegex.test(match) ? match : placeholder,
    )

function scrubValue(value: unknown, copies: WeakMap<object, unknown>) {
  if (typeof value === 'string') {
    return scrubString(value)
  }
  if (Array.isArray(value)) {
    if (copies.has(value)) {
      return copies.get(value)
    }
    const copy: unknown[] = []
    copies.set(value, copy)
    value.forEach(item => copy.push(scrubValue(item, copies)))
    return copy
  }
  if (isPlainObject(value)) {
    const object = value as Record<string, unknown>
    if (copies.has(object)) {
      return copies.get(object)
    }
    const copy: Record<string, unknown> = {}
    copies.set(object, copy)
    Object.entries(object).forEach(function ([key, item]) {
      copy[scrubString(key)] = skippedKeys.includes(key)
        ? item
        : scrubValue(item, copies)
    })
    return copy
  }
  // Class instances (such as Error) are kept as they are, as they may be
  // exotic objects. Sentry normalizes them into plain objects before calling
  // beforeSend, so they get scrubbed there.
  return value
}

// Replaces any EVM or BTC address found in the strings of the value with a
// placeholder, walking arrays and plain objects. It does not mutate the value.
export const scrubAddresses = <T>(value: T) =>
  scrubValue(value, new WeakMap()) as T
