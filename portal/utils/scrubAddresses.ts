import isPlainObject from 'lodash/isPlainObject'

const placeholder = '<address>'

// 0x + 40 hex chars, not followed by more hex, so tx hashes (0x + 64) are kept.
// No lookbehind is needed as "x" is not a hex char.
const evmAddressRegex = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g

// BTC addresses must start after a non alphanumeric char, or after a
// percent-encoded char (such as "%2F" in URLs), which is kept in the output.
// A match may start right after a "%", unless the "%" and the next two chars
// form an escape that is followed by a full address. In that case the escape
// is kept and the address after it is redacted.
const btcStartLookbehind = '(?<=^|[^0-9A-Za-z]|%[0-9A-Fa-f]{2})'

const buildBtcAddressRegex = (body: string, flags: string) =>
  new RegExp(
    `${btcStartLookbehind}(?<!%(?=[0-9A-Fa-f]{2}${body}))${body}`,
    flags,
  )

// bech32 and bech32m addresses, for mainnet, testnet and regtest
const bech32AddressRegex = buildBtcAddressRegex(
  '(?:bc|tb|bcrt)1[02-9ac-hj-np-z]{25,87}(?![0-9A-Za-z])',
  'gi',
)

// P2PKH and P2SH addresses, for mainnet (1, 3) and testnet (m, n, 2)
const base58AddressRegex = buildBtcAddressRegex(
  '[123mn][1-9A-HJ-NP-Za-km-z]{25,34}(?![0-9A-Za-z])',
  'g',
)

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

// Appends a numeric suffix to the key until it does not collide with any used
// key, so redacting several address keys of an object does not drop entries.
function getUniqueKey(key: string, usedKeys: Set<string>) {
  let uniqueKey = key
  let suffix = 2
  while (usedKeys.has(uniqueKey)) {
    uniqueKey = `${key}#${suffix}`
    suffix += 1
  }
  usedKeys.add(uniqueKey)
  return uniqueKey
}

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
    const entries = Object.entries(object).map(([key, item]) => ({
      item,
      key,
      scrubbedKey: scrubString(key),
    }))
    // Keys without addresses are kept as they are, so redacted keys must not
    // take them.
    const usedKeys = new Set(
      entries
        .filter(({ key, scrubbedKey }) => key === scrubbedKey)
        .map(({ key }) => key),
    )
    entries.forEach(function ({ item, key, scrubbedKey }) {
      const copyKey =
        key === scrubbedKey ? key : getUniqueKey(scrubbedKey, usedKeys)
      copy[copyKey] = skippedKeys.includes(key)
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
