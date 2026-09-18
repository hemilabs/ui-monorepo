import { InfoIcon } from 'components/icons/infoIcon'
import { Toggle } from 'components/toggle'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'use-intl'

type Operation = 'deposit' | 'withdraw'

const labelKeys = {
  deposit: 'label-deposit',
  withdraw: 'label-withdraw',
} as const satisfies Record<Operation, string>

const titleKeys = {
  deposit: 'title-deposit',
  withdraw: 'title-withdraw',
} as const satisfies Record<Operation, string>

type Props = {
  checked: boolean
  disabled?: boolean
  id: string
  onCheckedChange: (checked: boolean) => void
  operation: Operation
}

export const ExtraApproval = function ({
  checked,
  disabled = false,
  id,
  onCheckedChange,
  operation,
}: Props) {
  const t = useTranslations('common.extra-approval')
  // Doubles as the toggle's accessible name, since the text sits outside it.
  const label = t(labelKeys[operation])
  return (
    <div className="body-text-medium flex items-center justify-between gap-x-2 text-neutral-900 has-[:disabled]:cursor-not-allowed">
      <div className="flex items-center gap-x-1">
        <span>{label}</span>
        <Tooltip
          borderRadius="12px"
          id={`${id}-tooltip`}
          text={t('description')}
          title={t(titleKeys[operation])}
          variant="rich"
        >
          <button
            aria-label={t('more-info')}
            className="flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            type="button"
          >
            <InfoIcon aria-hidden />
          </button>
        </Tooltip>
      </div>
      <Toggle
        ariaLabel={label}
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
