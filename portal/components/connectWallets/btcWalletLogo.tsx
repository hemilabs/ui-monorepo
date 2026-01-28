import { ComponentProps, ReactNode } from 'react'

import { OkxLogo } from './okxLogo'
import { UnisatLogo } from './unisatLogo'

function getLogo(walletId: string, props?: ComponentProps<'svg'>) {
  const wallets: Record<string, ReactNode> = {
    okx: <OkxLogo {...props} />,
    unisat: <UnisatLogo {...props} />,
  }
  return wallets[walletId] || wallets.unisat
}

export const BtcWalletLogo = function ({
  walletId,
  ...props
}: {
  walletId: string | undefined
} & ComponentProps<'svg'>) {
  if (!walletId) {
    return null
  }
  return getLogo(walletId, props)
}
