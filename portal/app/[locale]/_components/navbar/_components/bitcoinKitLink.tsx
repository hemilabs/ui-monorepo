import { BitcoinKitIcon } from 'components/icons/bitcoinKit'
import { ComponentProps } from 'react'
import { useTranslations } from 'use-intl'

import { ItemLink } from './itemLink'

export const BitcoinKitLink = function (
  props: Pick<
    ComponentProps<typeof ItemLink>,
    'iconContainer' | 'itemContainer' | 'row'
  >,
) {
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - hbk"
      href="https://docs.hemi.xyz/building-bitcoin-apps/hemi-bitcoin-kit-hbk"
      icon={
        <div className="w-4 md:w-3">
          <BitcoinKitIcon />
        </div>
      }
      text={t('bitcoinkit')}
      {...props}
    />
  )
}
