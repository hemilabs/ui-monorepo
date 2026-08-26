import { NetworkStatusIcon } from 'components/icons/networkStatusIcon'
import { ComponentProps } from 'react'
import { useTranslations } from 'use-intl'

import { ItemLink } from './itemLink'

export const HemiStatusLink = function (
  props: Pick<
    ComponentProps<typeof ItemLink>,
    'iconContainer' | 'itemContainer' | 'row'
  >,
) {
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - network status"
      href="https://hemistatus.com"
      icon={
        <div className="max-md:size-4 md:w-3">
          <NetworkStatusIcon />
        </div>
      }
      text={t('network-status')}
      {...props}
    />
  )
}
