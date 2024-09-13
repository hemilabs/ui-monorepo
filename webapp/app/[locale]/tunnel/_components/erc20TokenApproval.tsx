import { useTranslations } from 'next-intl'
import { Tooltip } from 'ui-common/components/tooltip'

const InfoIcon = () => (
  <svg fill="none" height={12} width={12} xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#info_icon_clip)">
      <path
        clipRule="evenodd"
        d="M11.25 6A5.25 5.25 0 1 1 .75 6a5.25 5.25 0 0 1 10.5 0Zm-4.5-2.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM5.062 6a.563.563 0 1 0 0 1.125h.563v1.313a.563.563 0 1 0 1.125 0V6.562A.563.563 0 0 0 6.187 6H5.063Z"
        fill="#A3A3A3"
        fillRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="info_icon_clip">
        <path d="M0 0h12v12H0z" fill="#fff" />
      </clipPath>
    </defs>
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
      className={`block h-4 rounded-full ${
        checked ? 'bg-orange-500' : 'bg-neutral-100'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      htmlFor="erc20-approval-toggle"
    ></label>
  </div>
)

export const Erc20TokenApproval = function ({
  checked,
  disabled,
  onCheckedChange,
}: Props) {
  const t = useTranslations('common')
  // TODO disabled vs non-render?
  return (
    <div className="flex items-center gap-x-2">
      <div className="flex items-center">
        <span
          className={`text-ms font-medium leading-5 text-neutral-950 ${
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
