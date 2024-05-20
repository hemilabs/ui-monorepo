import { useTranslations } from 'next-intl'
import { Tooltip } from 'ui-common/components/tooltip'

const InfoIcon = ({ disabled }: { disabled: boolean }) => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className={disabled ? 'fill-neutral-400/30' : 'fill-neutral-400'}
      clipRule="evenodd"
      d="M1.33301 7.98991C1.33301 4.30991 4.31967 1.32324 7.99967 1.32324C11.6797 1.32324 14.6663 4.30991 14.6663 7.98991C14.6663 11.6699 11.6797 14.6566 7.99967 14.6566C4.31967 14.6566 1.33301 11.6699 1.33301 7.98991ZM2.66602 7.98958C2.66602 10.9296 5.05935 13.3229 7.99935 13.3229C10.9393 13.3229 13.3327 10.9296 13.3327 7.98958C13.3327 5.04958 10.9393 2.65625 7.99935 2.65625C5.05935 2.65625 2.66602 5.04958 2.66602 7.98958ZM7.19922 5.32344C7.19922 4.88161 7.55739 4.52344 7.99922 4.52344C8.44105 4.52344 8.79922 4.88161 8.79922 5.32344C8.79922 5.76526 8.44105 6.12344 7.99922 6.12344C7.55739 6.12344 7.19922 5.76526 7.19922 5.32344ZM7.33203 7.98991C7.33203 7.62172 7.63051 7.32324 7.9987 7.32324C8.36689 7.32324 8.66536 7.62172 8.66536 7.98991V10.6566C8.66536 11.0248 8.36689 11.3232 7.9987 11.3232C7.63051 11.3232 7.33203 11.0248 7.33203 10.6566V7.98991Z"
      fillRule="evenodd"
    />
  </svg>
)

type Props = {
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}

const Toggle = ({ checked, disabled, onCheckedChange }: Props) => (
  <div className="relative ml-auto inline-block w-10 rounded-full bg-gray-300 align-middle">
    <input
      checked={checked}
      className={`absolute ${
        checked ? 'right-1' : 'left-1'
      } top-1 block h-3 w-3 appearance-none rounded-full bg-white ${
        disabled ? 'cursor-default opacity-50' : 'cursor-pointer'
      }`}
      disabled={disabled}
      id="erc20-approval-toggle"
      name="erc20-approval-toggle"
      onChange={e =>
        disabled ? e.preventDefault() : onCheckedChange(e.target.checked)
      }
      type="checkbox"
    />
    <label
      className={`block h-5 rounded-full ${
        checked ? 'bg-emerald-300' : 'bg-gray-300'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      htmlFor="erc20-approval-toggle"
    ></label>
  </div>
)

export const Erc20Approval = function ({
  checked,
  disabled,
  onCheckedChange,
}: Props) {
  const t = useTranslations('common')
  return (
    <div className="flex w-full items-center gap-x-2 rounded-xl bg-zinc-50 px-4 py-2">
      <span
        className={`text-sm text-neutral-400 ${
          disabled ? 'text-opacity-30' : ''
        }`}
      >
        {t('erc20-extra-approval')}
      </span>
      <Tooltip
        disabled={disabled}
        id="erc20-approval-tooltip"
        overlay={
          <div className="w-60">
            <p className="mb-2 text-sm text-black">
              {t('erc20-approve-10x-deposits')}
            </p>
            <p className="text-xs text-gray-600">
              {t('erc20-approve-10x-detailed-description')}
            </p>
          </div>
        }
      >
        <InfoIcon disabled={disabled} />
      </Tooltip>
      <Toggle
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
