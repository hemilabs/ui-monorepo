import { GreenCheckIcon } from 'components/icons/greenCheckIcon'
import { WarningIcon } from 'components/icons/warningIcon'
import { Toggle } from 'components/toggle'
import { useTranslations } from 'next-intl'

import { ReceivingAddressLabel } from './receivingAddress'

const toggleId = 'use-custom-bitcoin-address'

type Props = {
  address: string | undefined
  customAddress: string
  isCustomAddressValid: boolean
  onCustomAddressChange: (customAddress: string) => void
  onUseCustomAddressChange: (useCustomAddress: boolean) => void
  receivingText: string
  tooltipText: string
  useCustomAddress: boolean
}

export const BitcoinReceivingAddress = function ({
  address,
  customAddress,
  isCustomAddressValid,
  onCustomAddressChange,
  onUseCustomAddressChange,
  receivingText,
  tooltipText,
  useCustomAddress,
}: Props) {
  const t = useTranslations('tunnel-page.form')

  return (
    // the top padding accounts for the 28px this container is tucked behind the
    // form card, so the label sits 16px below the card's edge, as designed
    <div className="rounded-b-2xl border border-solid border-neutral-300/55 bg-neutral-100 px-6 pb-4 pt-11 text-sm font-medium">
      <div className="flex items-center justify-between">
        <ReceivingAddressLabel
          receivingText={receivingText}
          tooltipText={tooltipText}
        />
        <div className="flex items-center gap-x-2">
          <label className="cursor-pointer text-neutral-600" htmlFor={toggleId}>
            {t('custom-address')}
          </label>
          <Toggle
            ariaLabel={t('custom-address')}
            checked={useCustomAddress}
            id={toggleId}
            onCheckedChange={onUseCustomAddressChange}
          />
        </div>
      </div>
      <div className="mt-4 h-px w-full bg-neutral-200" />
      <div className="mt-4 flex h-[18px] items-center gap-x-2">
        {useCustomAddress ? (
          <>
            <input
              // the input is only rendered while the toggle is on, so mounting
              // it is the moment the user asked for a custom address
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-neutral-950 placeholder:text-neutral-500 focus:outline-none"
              onChange={e => onCustomAddressChange(e.target.value)}
              placeholder={t('custom-address-placeholder')}
              spellCheck={false}
              type="text"
              value={customAddress}
            />
            {customAddress !== '' &&
              (isCustomAddressValid ? (
                <GreenCheckIcon />
              ) : (
                <div className="flex shrink-0 items-center gap-x-1 text-rose-600">
                  <WarningIcon />
                  <span>{t('invalid-address')}</span>
                </div>
              ))}
          </>
        ) : (
          <span className="text-neutral-950">{address ?? '-'}</span>
        )}
      </div>
    </div>
  )
}
