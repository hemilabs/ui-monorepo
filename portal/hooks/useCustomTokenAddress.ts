import { useQueryState } from 'nuqs'
import { parseAsEvmAddress } from 'utils/url'

export const useCustomTokenAddress = () =>
  useQueryState('customTokenAddress', parseAsEvmAddress)
