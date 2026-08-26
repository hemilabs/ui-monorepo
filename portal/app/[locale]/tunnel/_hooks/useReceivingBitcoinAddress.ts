import { useDebounce } from '@hemilabs/react-hooks/useDebounce'
import { type BtcChain } from 'btc-wallet/chains'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import { useIsValidBtcAddress } from './useIsValidBtcAddress'

type Props = {
  network: BtcChain['id']
  walletAddress: string | undefined
}

/**
 * Owns the address a Bitcoin withdrawal pays out to: the connected wallet's
 * address by default, or a custom one entered by the user.
 */
export const useReceivingBitcoinAddress = function ({
  network,
  walletAddress,
}: Props) {
  const [customAddress, setCustomAddress] = useState('')
  const [customAddressEnabled, setCustomAddressEnabled] = useState(false)
  const debouncedCustomAddress = useDebounce(customAddress, 300)
  const t = useTranslations('tunnel-page.submit-button')

  const { data, isError, isLoading } = useIsValidBtcAddress({
    address: debouncedCustomAddress,
    enabled: customAddressEnabled,
    network,
  })

  const isChecked = customAddress === debouncedCustomAddress

  const getIsCustomAddressValid = function () {
    if (customAddress === '') {
      return false
    }
    return isChecked ? data : undefined
  }

  const getAddressError = function () {
    if (!customAddressEnabled) {
      return undefined
    }
    if (customAddress === '') {
      return t('enter-a-custom-address')
    }
    if (!isChecked) {
      return undefined
    }
    if (isError) {
      return t('try-again')
    }
    return data === false ? t('input-a-correct-custom-address') : undefined
  }

  const canSubmitAddress = !customAddressEnabled || (isChecked && data === true)

  const isCheckingAddress =
    customAddressEnabled && customAddress !== '' && (!isChecked || isLoading)

  return {
    addressError: getAddressError(),
    canSubmitAddress,
    customAddress,
    customAddressEnabled,
    isCheckingAddress,
    isCustomAddressValid: getIsCustomAddressValid(),
    receivingAddress: customAddressEnabled ? customAddress : walletAddress,
    reset: useCallback(function () {
      setCustomAddress('')
      setCustomAddressEnabled(false)
    }, []),
    setCustomAddress,
    setCustomAddressEnabled,
  }
}
