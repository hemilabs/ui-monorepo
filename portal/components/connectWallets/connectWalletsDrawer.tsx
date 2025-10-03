import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { ButtonLink } from 'components/button'
import { Drawer, DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

import { BtcWallet, EvmWallet } from './wallets'
import { WarningIcon } from './warningIcon'

type Props = {
  closeDrawer: () => void
}

const P = ({ children }: { children: string }) => (
  <p className="text-center text-sm font-medium text-rose-600">{children}</p>
)

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
          <DrawerParagraph>{t('connect-wallets.description')}</DrawerParagraph>
          <div className="mb-3 mt-5">
            <EvmWallet />
          </div>
          <div className="flex flex-col items-center gap-y-3 rounded-2xl bg-neutral-50 px-1 pb-3 pt-1">
            <BtcWallet />
            <div
              className="mt-1 flex size-6 items-center justify-center rounded-full border border-solid
          border-rose-100 bg-rose-50 shadow-sm"
            >
              <WarningIcon />
            </div>
            <div>
              <P>
                {t(
                  'connect-wallets.unisat-is-the-only-supported-wallet.first-line',
                )}
              </P>
              <P>
                {t(
                  'connect-wallets.unisat-is-the-only-supported-wallet.second-line',
                )}
              </P>
            </div>
            <ButtonLink
              href="https://docs.hemi.xyz/how-to-tutorials/using-hemi/wallet-setup/btc-wallet-setup"
              size="xSmall"
              variant="tertiary"
            >
              {t('connect-wallets.how-to-create-unisat-wallet')}
            </ButtonLink>
          </div>
          <DrawerParagraph>
            {t('connect-wallets.btc-wallet-requirement')}
          </DrawerParagraph>
        </div>
      </div>
    </Drawer>
  )
}
