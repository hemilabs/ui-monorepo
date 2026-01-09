import { Drawer, DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

import { BtcWallet } from './wallets/btcWallet'
import { EvmWallet } from './wallets/evmWallet'

type Props = {
  closeDrawer: VoidFunction
}

export const ConnectWalletsDrawer = function ({ closeDrawer }: Props) {
  const t = useTranslations()
  const { track } = useUmami()

  const onClose = function () {
    track?.('close wallet drawer')

    closeDrawer()
  }

  return (
    <Drawer onClose={onClose}>
      <div className="drawer-content h-[85vh] overflow-y-auto md:h-full md:max-w-md">
        <div className="mb-3 flex h-full flex-col gap-y-3">
          <DrawerTopSection
            heading={t('common.connect-wallets')}
            onClose={closeDrawer}
          />
          <div className="mt-5">
            <EvmWallet />
          </div>
          <BtcWallet />
          <DrawerParagraph>
            {t('connect-wallets.btc-wallet-requirement')}
          </DrawerParagraph>
        </div>
      </div>
    </Drawer>
  )
}
