import { useTranslations } from 'next-intl'

type Props = {
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}

const Toggle = ({ checked, disabled, onCheckedChange }: Props) => (
  <div className="relative inline-block w-10 rounded-full bg-gray-300 align-middle">
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
    <div className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-4 py-2">
      <span
        className={`text-sm text-neutral-400 ${
          disabled ? 'text-opacity-30' : ''
        }`}
      >
        {t('erc20-extra-approval')}
      </span>
      <Toggle
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
