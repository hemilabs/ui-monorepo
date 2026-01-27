import { ComponentProps, ReactNode } from 'react'

import { OkxLogo } from './okxLogo'
import { UnisatLogo } from './unisatLogo'

function getLogo(walletId: string, props?: ComponentProps<'svg'>) {
  const wallets: Record<string, ReactNode> = {
    okx: <OkxLogo {...props} />,
    unisat: <UnisatLogo {...props} />,
  }

  // Match by wallet id (e.g., 'unisat', 'okx')
  const walletKey = Object.keys(wallets).find(key =>
    walletId.toLowerCase().includes(key.toLowerCase()),
  )

  // Default to unisat if not found
  return wallets[walletKey || 'unisat']
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
