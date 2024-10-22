import { ExplorerIcon } from 'components/icons/explorerIcon'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'

import { ItemLink } from './navItem'

export const HemiExplorerLink = function () {
  const hemi = useHemi()
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - explorer"
      href={hemi.blockExplorers.default.url}
      icon={<ExplorerIcon />}
      text={t('explorer')}
    />
  )
}
