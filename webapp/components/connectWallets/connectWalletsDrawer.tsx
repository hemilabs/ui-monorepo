import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { featureFlags } from 'app/featureFlags'
import { useTranslations } from 'next-intl'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { Drawer } from 'ui-common/components/drawer'

import { BtcWallet, EvmWallet } from './wallets'

const P = ({ text }: { text: string }) => (
  <p className="text-ms font-medium leading-5 text-neutral-500">{text}</p>
)

type Props = {
  closeDrawer: () => void
}

export const ConnectWalletsDrawer = function ({ closeDrawer }: Props) {
  const { accountModalOpen } = useAccountModal()
  const { chainModalOpen } = useChainModal()
  const { connectModalOpen } = useConnectModal()
  const t = useTranslations()

  // Rainbow kit's modals appear on top of the drawer. By clicking on those
  // technically we're clicking outside of the drawer, which would close it,
  // but we don't want to do so.
  // Luckily, there are some hooks to detect that those modals are opened,
  // and prevent this scenario.
  const onClose = function () {
    if (accountModalOpen || chainModalOpen || connectModalOpen) {
      return
    }
    closeDrawer()
  }

  return (
    <Drawer onClose={onClose}>
      <div className="pb-18 h-full rounded-t-xl border border-solid border-neutral-300/55 bg-white px-4 pt-6 shadow-lg md:max-w-md md:rounded-xl md:p-6 md:px-6">
        <div className="flex h-full flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium leading-8 text-neutral-950">
              {t('common.connect-wallets')}
            </h2>
            <button className="cursor-pointer" onClick={closeDrawer}>
              <CloseIcon className="[&>path]:hover:stroke-black" />
            </button>
          </div>
          {featureFlags.btcTunnelEnabled && (
            <P text={t('connect-wallets.description')} />
          )}
          <div className="mb-3 mt-5">
            <EvmWallet />
          </div>
          {featureFlags.btcTunnelEnabled && (
            <>
              <BtcWallet />
              <P text={t('connect-wallets.btc-wallet-requirement')} />
            </>
          )}
        </div>
      </div>
    </Drawer>
  )
}
