import { createParser, useQueryState } from 'nuqs'
import { isAddress } from 'viem'

// EVM-address query-string parser. Defined here (a client module) rather than
// in `utils/url` so server modules importing the URL helpers don't drag nuqs's
// client-only `createParser` into the server bundle.
const parseAsEvmAddress = createParser({
  parse: (queryValue: string) => (isAddress(queryValue) ? queryValue : null),
  serialize: value => value,
})

export const useCustomTokenAddress = () =>
  useQueryState('customTokenAddress', parseAsEvmAddress)
