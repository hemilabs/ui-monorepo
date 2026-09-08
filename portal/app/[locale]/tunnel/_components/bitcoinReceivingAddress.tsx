import { CheckCircleIcon } from 'components/icons/checkCircleIcon'
import { WarningIcon } from 'components/icons/warningIcon'
import { Spinner } from 'components/spinner'
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
  isCheckingAddress: boolean
  isCustomAddressValid: boolean | undefined
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
  isCheckingAddress,
  isCustomAddressValid,
  onCustomAddressChange,
  onCustomAddressEnabledChange,
  receivingText,
  tooltipText,
}: Props) {
  const t = useTranslations('tunnel-page.form')
  const showError = customAddress !== '' && isCustomAddressValid === false

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
              autoCapitalize="none"
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
            {isCheckingAddress && <Spinner size="xSmall" variant="orange" />}
            {isCustomAddressValid === true && (
              <CheckCircleIcon className="size-4 shrink-0 text-emerald-500" />
            )}
          </>
        ) : (
          <span className="text-neutral-950">{address ?? '-'}</span>
        )}
      </div>
    </div>
  )
}
