import { useTranslations } from 'use-intl'
import { useAccount } from 'wagmi'

import { resolveReceivingEvmAddress } from '../_utils/receivingEvmAddress'

import { type useTunnelState } from './useTunnelState'

type Props = Pick<
  ReturnType<typeof useTunnelState>,
  'customEvmAddress' | 'customEvmAddressEnabled' | 'updateCustomEvmAddress'
>

export const useReceivingEvmAddress = function ({
  customEvmAddress,
  customEvmAddressEnabled,
  updateCustomEvmAddress,
}: Props) {
  const { address: walletAddress } = useAccount()
  const t = useTranslations('tunnel-page.submit-button')

  const { errorKey, isCustomAddressValid, receivingAddress } =
    resolveReceivingEvmAddress({
      customAddress: customEvmAddress,
      customAddressEnabled: customEvmAddressEnabled,
      walletAddress,
    })

  return {
    addressError: errorKey ? t(errorKey) : undefined,
    customAddress: customEvmAddress,
    customAddressEnabled: customEvmAddressEnabled,
    isCustomAddressValid,
    onCustomAddressChange: (address: string) =>
      updateCustomEvmAddress({ customEvmAddress: address }),
    onCustomAddressEnabledChange: (enabled: boolean) =>
      updateCustomEvmAddress({ customEvmAddressEnabled: enabled }),
    receivingAddress,
  }
}
