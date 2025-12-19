import { GenesisDropIcon } from 'components/icons/genesisDropIcon'
import { useTranslations } from 'next-intl'

import { ItemLink } from './itemLink'

export const GenesisDrop = function () {
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - genesis drop"
      href="/genesis-drop"
      icon={
        <div className="flex w-5 items-center justify-center md:w-2.5">
          <GenesisDropIcon />
        </div>
      }
      text={t('genesis-drop')}
    />
  )
}
