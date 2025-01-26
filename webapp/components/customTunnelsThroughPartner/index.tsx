import { Drawer, DrawerParagraph, DrawerTitle } from 'components/drawer'
import { WarningBox } from 'components/warningBox'
import { hemiMainnet } from 'networks/hemiMainnet'
import { mainnet } from 'networks/mainnet'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { CloseIcon } from 'ui-common/components/closeIcon'
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
      <div className="drawer-content w-full max-md:pb-16 md:h-full md:w-[450px] md:max-w-md">
        <div className="flex items-center justify-between">
          <DrawerTitle>
            {t(`${operation}.heading`, { symbol: fromToken.symbol })}
          </DrawerTitle>
          <button className="cursor-pointer" onClick={onClose}>
            <CloseIcon className="[&>path]:hover:stroke-black" />
          </button>
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
