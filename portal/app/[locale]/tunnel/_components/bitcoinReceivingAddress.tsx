import { GreenCheckIcon } from 'components/icons/greenCheckIcon'
import { WarningIcon } from 'components/icons/warningIcon'
import { Toggle } from 'components/toggle'
import { useTranslations } from 'next-intl'

import { ReceivingAddressLabel } from './receivingAddress'

const toggleId = 'use-custom-bitcoin-address'
const errorId = 'custom-bitcoin-address-error'

type Props = {
  address: string | undefined
  customAddress: string
  customAddressEnabled: boolean
  disabled: boolean
  isCustomAddressValid: boolean
  onCustomAddressChange: (customAddress: string) => void
  onCustomAddressEnabledChange: (customAddressEnabled: boolean) => void
  receivingText: string
  tooltipText: string
}

export const BitcoinReceivingAddress = function ({
  address,
  customAddress,
  customAddressEnabled,
  disabled,
  isCustomAddressValid,
  onCustomAddressChange,
  onCustomAddressEnabledChange,
  receivingText,
  tooltipText,
}: Props) {
  const t = useTranslations('tunnel-page.form')
  // an empty field is not an error yet, it is just not filled in
  const showError = customAddress !== '' && !isCustomAddressValid

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
            checked={customAddressEnabled}
            disabled={disabled}
            id={toggleId}
            onCheckedChange={onCustomAddressEnabledChange}
          />
        </div>
      </div>
      <div className="mt-4 h-px w-full bg-neutral-200" />
      <div className="mt-4 flex h-4.5 items-center gap-x-2">
        {customAddressEnabled ? (
          <>
            <input
              aria-describedby={showError ? errorId : undefined}
              aria-invalid={showError}
              aria-label={receivingText}
              // addresses are never capitalized, and mobile keyboards would
              // otherwise produce a mixed case one, which is invalid
              autoCapitalize="none"
              // mounting only happens when the user turns the toggle on
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-neutral-950 placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed"
              disabled={disabled}
              onChange={e => onCustomAddressChange(e.target.value.trim())}
              placeholder={t('custom-address-placeholder')}
              spellCheck={false}
              type="text"
              value={customAddress}
            />
            {showError && (
              <div className="flex shrink-0 items-center gap-x-1 text-rose-600">
                <WarningIcon />
                <span id={errorId}>{t('invalid-address')}</span>
              </div>
            )}
            {customAddress !== '' && isCustomAddressValid && <GreenCheckIcon />}
          </>
        ) : (
          <span className="text-neutral-950">{address ?? '-'}</span>
        )}
      </div>
    </div>
  )
}
