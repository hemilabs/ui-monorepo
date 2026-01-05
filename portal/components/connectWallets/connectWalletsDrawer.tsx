import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { Drawer, DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

import { BtcWallet } from './wallets/btcWallet'
import { EvmWallet } from './wallets/evmWallet'

type Props = {
  closeDrawer: VoidFunction
}

export const ConnectWalletsDrawer = function ({ closeDrawer }: Props) {
  const { accountModalOpen } = useAccountModal()
  const { chainModalOpen } = useChainModal()
  const { connectModalOpen } = useConnectModal()
  const t = useTranslations()
  const { track } = useUmami()

  // Rainbow kit's modals appear on top of the drawer. By clicking on those
  // technically we're clicking outside of the drawer, which would close it,
  // but we don't want to do so.
  // Luckily, there are some hooks to detect that those modals are opened,
  // and prevent this scenario.
  const onClose = function () {
    if (accountModalOpen || chainModalOpen || connectModalOpen) {
      return
    }
    track?.('close wallet drawer')

    closeDrawer()
  }

  return (
    <Drawer onClose={onClose}>
      <div className="drawer-content max-md:max-h-85vh h-full overflow-y-auto md:max-w-md">
        <div className="flex h-full flex-col gap-y-3">
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
