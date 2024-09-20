import { InfoIcon } from 'components/icons/infoIcon'
import { useTranslations } from 'next-intl'
import { Tooltip } from 'ui-common/components/tooltip'

type Props = {
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}

const Toggle = ({ checked, disabled, onCheckedChange }: Props) => (
  <div
    className={`ml-auto h-5 w-9 rounded-full bg-neutral-100 ${
      checked ? 'bg-orange-500' : 'bg-neutral-100'
    } ${disabled ? 'opacity-40' : ''}`}
    style={{ boxShadow: '0px 0px 3px 0px rgba(0, 0, 0, 0.12) inset' }}
  >
    <label
      className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      htmlFor="erc20-approval-toggle"
    >
      <input
        checked={checked}
        className={`mt-0.5 border-[0.6px] border-solid border-neutral-300/55 ${
          checked ? 'ml-auto mr-0.5' : 'ml-0.5 mr-auto'
        } ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } block h-4 w-4 appearance-none rounded-full bg-white`}
        disabled={disabled}
        id="erc20-approval-toggle"
        name="erc20-approval-toggle"
        onChange={e =>
          disabled ? e.preventDefault() : onCheckedChange(e.target.checked)
        }
        type="checkbox"
      />
    </label>
  </div>
)

export const Erc20TokenApproval = function ({
  checked,
  disabled,
  onCheckedChange,
}: Props) {
  const t = useTranslations('common')
  return (
    <div
      className={`text-ms ${
        disabled ? 'cursor-not-allowed' : ''
      } flex items-center gap-x-2 font-medium leading-5 text-neutral-950`}
    >
      <div className="flex items-center gap-x-1">
        <span>{t('erc20-extra-approval')}</span>
        <Tooltip
          disabled={disabled}
          id="erc20-approval-tooltip"
          overlay={
            <div className="w-60">
              <p className="text-ms mb-2 font-medium text-neutral-950">
                {t('erc20-approve-10x-deposits')}
              </p>
              <p className="text-xs font-normal text-neutral-400">
                {t('erc20-approve-10x-detailed-description')}
              </p>
            </div>
          }
        >
          <InfoIcon />
        </Tooltip>
      </div>
      <Toggle
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
