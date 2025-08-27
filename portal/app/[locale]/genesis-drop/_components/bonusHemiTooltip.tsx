import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

type Props = {
  bonus: ReactNode
}

export const BonusHemiTooltip = function ({ bonus }: Props) {
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <Tooltip
      borderRadius="12px"
      id="bonus-hemi"
      overlay={
        <p className="p-4 text-sm font-medium text-white">
          {t.rich('this-option-includes-bonus', { bonus: () => bonus })}
        </p>
      }
    >
      <div className="group/icon">
        <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
      </div>
    </Tooltip>
  )
}
