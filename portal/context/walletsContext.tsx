import { type Locale } from 'app/i18n'

import { BtcWalletContext } from './btcWalletContext'
import { EvmWalletContext } from './evmWalletContext'

type Props = {
  children: React.ReactNode
  locale: Locale
}

export const WalletsContext = ({ children, locale }: Props) => (
  <EvmWalletContext locale={locale}>
    <BtcWalletContext>{children}</BtcWalletContext>
  </EvmWalletContext>
)
