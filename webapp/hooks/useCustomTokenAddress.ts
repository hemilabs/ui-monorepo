import { createParser, useQueryState } from 'nuqs'
import { isAddress } from 'viem'

const parseAsEvmAddress = createParser({
  parse: (queryValue: string) => (isAddress(queryValue) ? queryValue : null),
  serialize: value => value,
})

export const useCustomTokenAddress = () =>
  useQueryState('customTokenAddress', parseAsEvmAddress.withDefault(null))
