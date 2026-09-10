import { DocsIcon } from 'components/icons/docsIcon'
import { ComponentProps } from 'react'
import { useTranslations } from 'use-intl'

import { ItemLink } from './itemLink'

export const DocsLink = function (
  props: Pick<
    ComponentProps<typeof ItemLink>,
    'iconContainer' | 'itemContainer' | 'row'
  >,
) {
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - docs"
      href="https://docs.hemi.xyz"
      icon={
        <div className="max-md:size-4 md:w-3">
          <DocsIcon />
        </div>
      }
      text={t('docs')}
      {...props}
    />
  )
}
