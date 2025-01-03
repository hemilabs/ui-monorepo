import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { featureFlags } from 'app/featureFlags'
import { Drawer, DrawerParagraph, DrawerTitle } from 'components/drawer'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { CloseIcon } from 'ui-common/components/closeIcon'

import { BtcWallet, EvmWallet } from './wallets'

type Props = {
  closeDrawer: () => void
}

export const ConnectWalletsDrawer = function ({ closeDrawer }: Props) {
  const { accountModalOpen } = useAccountModal()
  const { chainModalOpen } = useChainModal()
  const { connectModalOpen } = useConnectModal()
  const [networkType] = useNetworkType()
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
    track?.('close wallet drawer', { chain: networkType })

    closeDrawer()
  }

  return (
    <Drawer onClose={onClose}>
      <div className="pb-18 h-full bg-white px-4 pt-6 md:max-w-md md:p-6">
        <div className="flex h-full flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <DrawerTitle>{t('common.connect-wallets')}</DrawerTitle>
            <button className="cursor-pointer" onClick={closeDrawer}>
              <CloseIcon className="[&>path]:hover:stroke-black" />
            </button>
          </div>
          {featureFlags.btcTunnelEnabled ? (
            <DrawerParagraph>
              {t('connect-wallets.description')}
            </DrawerParagraph>
          ) : (
            // Prevent layout shift when text is not shown
            <div className="invisible min-w-[400px]"></div>
          )}
          <div className="mb-3 mt-5">
            <EvmWallet />
          </div>
          {featureFlags.btcTunnelEnabled && (
            <>
              <BtcWallet />
              <DrawerParagraph>
                {t('connect-wallets.btc-wallet-requirement')}
              </DrawerParagraph>
            </>
          )}
        </div>
      </div>
    </Drawer>
  )
}
