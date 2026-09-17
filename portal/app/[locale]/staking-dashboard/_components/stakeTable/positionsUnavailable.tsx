import { InformationBox } from 'components/informationBox'
import { useTranslations } from 'use-intl'

import { EmptyIcon } from '../../_icons/emptyIcon'

// Shown when the positions could not be read. Distinct from the empty state: a failed
// read used to be caught into an empty list, so someone whose positions hadn't loaded
// was told they had none and invited to go and stake.
export function PositionsUnavailable() {
  const t = useTranslations('staking-dashboard.table')

  return (
    <InformationBox
      icon={<EmptyIcon />}
      subtitle={t('positions-unavailable-subtitle')}
      title={t('positions-unavailable')}
    />
  )
}
