import { Drawer, DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { WarningBox } from 'components/warningBox'
import { hemiMainnet } from 'networks/hemiMainnet'
import { mainnet } from 'networks/mainnet'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { isEvmToken } from 'utils/token'

import { Stargate } from './stargate'

const customTunnelTokens = ['USDC', 'USDT']

export const tunnelsThroughPartner = (token: Token) =>
  customTunnelTokens.includes(token.symbol) &&
  isEvmToken(token) &&
  [hemiMainnet.id, mainnet.id].includes(token.chainId)

type Props = {
  fromToken: Token
  onClose: () => void
  operation: 'deposit' | 'withdraw'
  toToken: Token
}

export const CustomTunnelsThroughPartner = function ({
  fromToken,
  onClose,
  operation,
  toToken,
}: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  return (
    <Drawer onClose={onClose}>
      <div className="drawer-content max-md:pb-16 md:h-full">
        <div className="flex items-center justify-between">
          <DrawerTopSection
            heading={t(`${operation}.heading`, { symbol: fromToken.symbol })}
            onClose={onClose}
          />
        </div>
        <div className="mb-3">
          <DrawerParagraph>
            {t(`${operation}.subheading`, { symbol: fromToken.symbol })}
          </DrawerParagraph>
        </div>
        <div>
          <Stargate fromToken={fromToken} toToken={toToken} />
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
