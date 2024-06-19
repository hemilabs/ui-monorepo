import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { Drawer } from 'ui-common/components/drawer'

import { BtcWallet, EvmWallet } from './wallets'

const P = ({ text }: { text: string }) => (
  <p className="text-xs font-normal leading-normal text-slate-500">{text}</p>
)

type Props = {
  closeDrawer: () => void
}

export const ConnectWalletsDrawer = function ({ closeDrawer }: Props) {
  const { accountModalOpen } = useAccountModal()
  const { chainModalOpen } = useChainModal()
  const { openConnectModal } = useConnectModal()
  const t = useTranslations()

  // Rainbow kit's modals appear on top of the drawer. By clicking on those
  // technically we're clicking outside of the drawer, which would close it,
  // but we don't want to do so.
  // Luckily, there are some hooks to detect that those modals are opened,
  // and prevent this scenario.
  const onClose = function () {
    if (accountModalOpen || chainModalOpen || openConnectModal) {
      return
    }
    closeDrawer()
  }

  return (
    <Drawer onClose={onClose}>
      <div className="h-full rounded-t-xl border border-solid border-slate-200 bg-white px-4 pb-12 pt-6 md:max-w-md md:rounded-xl md:p-6">
        <div className="flex h-full flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium leading-5">
              {t('common.connect-wallets')}
            </h2>
            <button className="cursor-pointer" onClick={closeDrawer}>
              <CloseIcon />
            </button>
          </div>
          <P text={t('connect-wallets.description')} />
          <EvmWallet />
          <BtcWallet />
          <P text={t('connect-wallets.btc-wallet-requirement')} />
        </div>
      </div>
    </Drawer>
  )
}
