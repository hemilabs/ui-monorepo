import { InfoIcon } from 'components/icons/infoIcon'
import { Toggle } from 'components/toggle'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'use-intl'

type Props = {
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}

export const Erc20TokenApproval = function ({
  checked,
  disabled,
  onCheckedChange,
}: Props) {
  const t = useTranslations('common')
  return (
    <div
      className={`text-sm ${
        disabled ? 'cursor-not-allowed' : ''
      } flex items-center justify-between gap-x-2 font-medium text-neutral-950`}
    >
      <div className="flex items-center gap-x-1">
        <span>{t('erc20-extra-approval')}</span>
        <Tooltip
          borderRadius="12px"
          disabled={disabled}
          id="erc20-approval-tooltip"
          text={t('erc20-approve-10x-detailed-description')}
          title={t('erc20-approve-10x-deposits')}
          variant="rich"
        >
          <InfoIcon />
        </Tooltip>
      </div>
      <Toggle
        ariaLabel={t('erc20-extra-approval')}
        checked={checked}
        disabled={disabled}
        id="erc20-approval-toggle"
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
