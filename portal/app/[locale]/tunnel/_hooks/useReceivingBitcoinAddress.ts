import { type BtcChain } from 'btc-wallet/chains'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { isValidBtcAddress } from 'utils/bitcoin'
import type { validateSubmit } from 'utils/validateSubmit'

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
  const [useCustomAddress, setUseCustomAddress] = useState(false)
  const t = useTranslations('tunnel-page.submit-button')

  const isCustomAddressValid =
    !useCustomAddress || isValidBtcAddress(customAddress, network)

  return {
    canSubmit: amountValidation.canSubmit && isCustomAddressValid,
    customAddress,
    isCustomAddressValid,
    receivingAddress: useCustomAddress ? customAddress : walletAddress,
    reset: useCallback(function () {
      setCustomAddress('')
      setUseCustomAddress(false)
    }, []),
    setCustomAddress,
    setUseCustomAddress,
    useCustomAddress,
    validationError:
      amountValidation.error ??
      (isCustomAddressValid ? undefined : t('input-a-correct-custom-address')),
  }
}
