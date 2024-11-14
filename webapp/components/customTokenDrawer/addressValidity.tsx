import { GreenCheckIcon } from 'components/icons/greenCheckIcon'
import { RedErrorIcon } from 'components/icons/redErrorIcon'
import { useTranslations } from 'next-intl'

type Props = {
  isValid: boolean
}

export const AddressValidity = function ({ isValid }: Props) {
  const t = useTranslations('token-custom-drawer')
  return (
    <div className="flex items-center gap-x-1">
      {isValid ? <GreenCheckIcon /> : <RedErrorIcon />}
      <span
        className={`text-sm font-medium ${
          isValid ? 'text-emerald-500' : 'text-rose-500'
        }`}
      >
        {t(isValid ? 'this-address-is-valid' : 'this-address-is-not-valid')}
      </span>
    </div>
  )
}
