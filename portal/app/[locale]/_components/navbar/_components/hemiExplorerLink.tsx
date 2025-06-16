import { ExplorerIcon } from 'components/icons/explorerIcon'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { ComponentProps, Suspense } from 'react'

import { ExternalLinkUI } from './externalLink'
import { ItemLink } from './itemLink'

const ExplorerLink = function (
  props: Pick<ComponentProps<typeof ItemLink>, 'icon' | 'text'>,
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

export const HemiExplorerLink = function () {
  const t = useTranslations('navbar')

  const text = t('explorer')

  const props = {
    icon: <ExplorerIcon />,
    text,
  }

  return (
    // The explorer link depends on mainnet|testnet, but the UI is exactly the same
    <Suspense fallback={<ExternalLinkUI {...props} />}>
      <ExplorerLink {...props} />
    </Suspense>
  )
}
