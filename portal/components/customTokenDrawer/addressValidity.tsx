import { GreenCheckIcon } from 'components/icons/greenCheckIcon'
import { RedErrorIcon } from 'components/icons/redErrorIcon'
import { useTranslations } from 'next-intl'

export type AddressValidity =
  | 'this-address-is-valid'
  | 'this-address-is-not-valid'
  | 'address-does-not-match-l2'
  | 'l1-address-not-configured'

type Props = {
  validity: AddressValidity | undefined
}

export const AddressValidity = function ({ validity }: Props) {
  const t = useTranslations('token-custom-drawer')
  if (!validity) {
    return <div />
  }
  const isValid = validity === 'this-address-is-valid'
  return (
    <div className="flex items-center gap-x-1">
      {isValid ? <GreenCheckIcon /> : <RedErrorIcon />}
      <span
        className={`text-sm font-medium ${
          isValid ? 'text-emerald-500' : 'text-rose-500'
        }`}
      >
        {t(validity)}
      </span>
    </div>
  )
}
