import { GenesisDropIcon } from 'components/icons/genesisDropIcon'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { isGenesisDropEnabled } from 'utils/featureFlags'

import { ItemLink } from './itemLink'

const GenesisDropImpl = function () {
  const hemi = useHemi()
  const t = useTranslations('navbar')

  const isEnabled = isGenesisDropEnabled(hemi.id)

  if (!isEnabled) {
    return null
  }

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

export const GenesisDrop = () => (
  <Suspense>
    <GenesisDropImpl />
  </Suspense>
)
