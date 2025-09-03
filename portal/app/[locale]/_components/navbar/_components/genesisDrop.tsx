import { GenesisDropIcon } from 'components/icons/genesisDropIcon'
import { useTranslations } from 'next-intl'

import { ItemLink } from './itemLink'

export const GenesisDrop = function () {
  const t = useTranslations('navbar')

  return (
    <li className="[&>div]:px-2">
      <ItemLink
        event="nav - genesis drop"
        href="/genesis-drop"
        icon={<GenesisDropIcon />}
        text={t('genesis-drop')}
      />
    </li>
  )
}
