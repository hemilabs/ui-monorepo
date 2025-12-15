import { ExplorerIcon } from 'components/icons/explorerIcon'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { ComponentProps, Suspense } from 'react'

import { ExternalLinkUI } from './externalLink'
import { ItemLink } from './itemLink'

const ExplorerLink = function (
  props: Pick<
    ComponentProps<typeof ItemLink>,
    'icon' | 'itemContainer' | 'text'
  >,
) {
  const hemi = useHemi()
  return (
    <ItemLink
      {...props}
      event="nav - explorer"
      href={hemi.blockExplorers!.default.url}
    />
  )
}

export const HemiExplorerLink = function (
  props: Pick<
    ComponentProps<typeof ItemLink>,
    'iconContainer' | 'itemContainer' | 'row'
  >,
) {
  const t = useTranslations('navbar')

  const text = t('explorer')

  const commonProps = {
    icon: (
      <div className="max-md:size-4 md:w-3">
        <ExplorerIcon />
      </div>
    ),
    text,
    ...props,
  }

  return (
    // The explorer link depends on mainnet|testnet, but the UI is exactly the same
    <Suspense fallback={<ExternalLinkUI {...commonProps} />}>
      <ExplorerLink {...commonProps} />
    </Suspense>
  )
}
