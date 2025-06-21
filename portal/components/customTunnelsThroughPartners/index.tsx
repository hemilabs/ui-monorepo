import { Drawer, DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { WarningBox } from 'components/warningBox'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'

import { Meson } from './meson'
import { Stargate } from './stargate'

type Props = {
  fromToken: Token
  onClose: () => void
  operation: 'deposit' | 'withdraw'
  toToken: Token
}

export const CustomTunnelsThroughPartners = function ({
  fromToken,
  onClose,
  operation,
  toToken,
}: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  return (
    <Drawer onClose={onClose}>
      <div className="drawer-content max-md:pb-16 md:h-full">
        <DrawerTopSection
          heading={t(`${operation}.heading`, { symbol: fromToken.symbol })}
          onClose={onClose}
        />
        <div className="mb-3">
          <DrawerParagraph>
            {t(`${operation}.subheading`, { symbol: fromToken.symbol })}
          </DrawerParagraph>
        </div>
        <div className="mb-3 space-y-4">
          <Stargate fromToken={fromToken} toToken={toToken} />
          <Meson />
        </div>
        <p className="mb-3 text-sm font-medium text-zinc-500">
          {t('description')}
        </p>
        <div>
          <WarningBox
            heading={t('use-at-your-own-risk')}
            subheading={t('hemi-bears-no-responsibility')}
          />
        </div>
      </div>
    </Drawer>
  )
}
