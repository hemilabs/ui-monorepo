import { type BtcChain } from 'btc-wallet/chains'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import type { validateSubmit } from 'utils/validateSubmit'

import { useIsValidBtcAddress } from './useIsValidBtcAddress'

type Props = {
  amountValidation: ReturnType<typeof validateSubmit>
  network: BtcChain['id']
  walletAddress: string | undefined
}

/**
 * Owns the address a Bitcoin withdrawal pays out to: the connected wallet's
 * address by default, or a custom one entered by the user. The address check is
 * merged into the amount validation, as the submit button reports it last.
 */
export const useReceivingBitcoinAddress = function ({
  amountValidation,
  network,
  walletAddress,
}: Props) {
  const [customAddress, setCustomAddress] = useState('')
  const [customAddressEnabled, setCustomAddressEnabled] = useState(false)
  const [customAddressTouched, setCustomAddressTouched] = useState(false)
  const t = useTranslations('tunnel-page.submit-button')

  const { data, isError } = useIsValidBtcAddress({
    address: customAddress,
    enabled: customAddressEnabled,
    network,
  })

  const isCustomAddressValid = customAddress === '' ? false : data

  const getAddressError = function () {
    if (!customAddressEnabled || !customAddressTouched) {
      return undefined
    }
    if (isError) {
      return t('try-again')
    }
    if (customAddress === '') {
      return t('enter-a-custom-address')
    }
    return isCustomAddressValid === false
      ? t('input-a-correct-custom-address')
      : undefined
  }

  const canSubmit =
    amountValidation.canSubmit &&
    (!customAddressEnabled || isCustomAddressValid === true)

  return {
    canSubmit,
    customAddress,
    customAddressEnabled,
    customAddressTouched,
    isCustomAddressValid,
    receivingAddress: customAddressEnabled ? customAddress : walletAddress,
    reset: useCallback(function () {
      setCustomAddress('')
      setCustomAddressEnabled(false)
      setCustomAddressTouched(false)
    }, []),
    setCustomAddress,
    setCustomAddressEnabled,
    setCustomAddressTouched,
    validationError: amountValidation.error ?? getAddressError(),
  }
}
