'use client'

import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { BtcWallet } from './wallets/btcWallet'
import { EvmWallet } from './wallets/evmWallet'

type Props = {
  closeDrawer: VoidFunction
}

export const ConnectWalletsDrawer = function ({ closeDrawer }: Props) {
  const t = useTranslations()
  const { track } = useUmami()

  const onClose = useCallback(
    function onClose() {
      track?.('close wallet drawer')
      closeDrawer()
    },
    [closeDrawer, track],
  )

  return (
    <div className="drawer-content !min-h-full sm:pb-6 md:max-w-md">
      <div className="mb-3 flex flex-col gap-y-3">
        <DrawerTopSection
          heading={t('common.connect-wallets')}
          onClose={onClose}
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
