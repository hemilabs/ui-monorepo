import { CheckCircleIcon } from 'components/icons/checkCircleIcon'
import { InfoIcon } from 'components/icons/infoIcon'
import { WarningIcon } from 'components/icons/warningIcon'
import { Spinner } from 'components/spinner'
import { Toggle } from 'components/toggle'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'use-intl'

const toggleId = 'use-custom-address'
const errorId = 'custom-address-error'

type LabelProps = {
  receivingText: string
  tooltipText: string
}

const ReceivingAddressLabel = ({ receivingText, tooltipText }: LabelProps) => (
  <div className="flex items-center gap-x-2">
    <span className="text-neutral-600">{receivingText}</span>
    <Tooltip id="target-address" text={tooltipText} variant="info">
      <div className="group/icon">
        <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-600" />
      </div>
    </Tooltip>
  </div>
)

type CustomAddressToggleProps = {
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}

const CustomAddressToggle = function ({
  checked,
  disabled,
  onCheckedChange,
}: CustomAddressToggleProps) {
  const t = useTranslations('tunnel-page.form')
  return (
    <div className="flex items-center gap-x-2">
      <label className="cursor-pointer text-neutral-600" htmlFor={toggleId}>
        {t('custom-address')}
      </label>
      <Toggle
        ariaLabel={t('custom-address')}
        checked={checked}
        disabled={disabled}
        id={toggleId}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}

type CustomAddressInputProps = {
  customAddress: string
  disabled: boolean
  isCheckingAddress: boolean
  isCustomAddressValid: boolean | undefined
  onCustomAddressChange: (customAddress: string) => void
  placeholder: string
  receivingText: string
}

const CustomAddressInput = function ({
  customAddress,
  disabled,
  isCheckingAddress,
  isCustomAddressValid,
  onCustomAddressChange,
  placeholder,
  receivingText,
}: CustomAddressInputProps) {
  const t = useTranslations('tunnel-page.form')
  const showError = customAddress !== '' && isCustomAddressValid === false

  return (
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
        placeholder={placeholder}
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
  )
}

type EditableProps = {
  customAddress: string
  customAddressEnabled: boolean
  disabled: boolean
  editable: true
  isCheckingAddress: boolean
  isCustomAddressValid: boolean | undefined
  onCustomAddressChange: (customAddress: string) => void
  onCustomAddressEnabledChange: (customAddressEnabled: boolean) => void
  placeholder: string
}

type Props = LabelProps & {
  address: string | undefined
} & ({ editable: false } | EditableProps)

export const ReceivingAddress = function (props: Props) {
  const { address, receivingText, tooltipText } = props

  return (
    // the top padding accounts for the 28px this container is tucked behind the
    // form card, so the label sits 16px below the card's edge, as designed
    <div className="rounded-b-2xl border border-solid border-neutral-300/55 bg-neutral-100 px-6 pb-4 pt-11 text-sm font-medium">
      <div className="flex items-center justify-between">
        <ReceivingAddressLabel
          receivingText={receivingText}
          tooltipText={tooltipText}
        />
        {props.editable && (
          <CustomAddressToggle
            checked={props.customAddressEnabled}
            disabled={props.disabled}
            onCheckedChange={props.onCustomAddressEnabledChange}
          />
        )}
      </div>
      <div className="mt-4 h-px w-full bg-neutral-200" />
      <div className="mt-4 flex h-4.5 items-center gap-x-2">
        {props.editable && props.customAddressEnabled ? (
          <CustomAddressInput
            customAddress={props.customAddress}
            disabled={props.disabled}
            isCheckingAddress={props.isCheckingAddress}
            isCustomAddressValid={props.isCustomAddressValid}
            onCustomAddressChange={props.onCustomAddressChange}
            placeholder={props.placeholder}
            receivingText={receivingText}
          />
        ) : (
          <span className="text-neutral-950">{address ?? '-'}</span>
        )}
      </div>
    </div>
  )
}
