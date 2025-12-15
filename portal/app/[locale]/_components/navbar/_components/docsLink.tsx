import { DocsIcon } from 'components/icons/docsIcon'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'

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
