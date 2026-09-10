import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { ReactNode } from 'react'
import { useTranslations } from 'use-intl'

type Props = {
  bonus: ReactNode
}

export const BonusHemiTooltip = function ({ bonus }: Props) {
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <Tooltip
      borderRadius="12px"
      id="bonus-hemi"
      text={t.rich('this-option-includes-bonus', { bonus: () => bonus })}
      variant="info"
    >
      <div className="group/icon">
        <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
      </div>
    </Tooltip>
  )
}
