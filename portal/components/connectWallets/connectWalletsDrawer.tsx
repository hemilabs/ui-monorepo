'use client'

import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { useTranslations } from 'next-intl'

import { BtcWallet } from './wallets/btcWallet'
import { EvmWallet } from './wallets/evmWallet'

type Props = {
  closeDrawer: VoidFunction
}

export const ConnectWalletsDrawer = function ({ closeDrawer }: Props) {
  const t = useTranslations()

  return (
    <div className="drawer-content pb-6 md:h-full md:max-w-md">
      <div className="mb-3 flex flex-col gap-y-3">
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
  )
}
