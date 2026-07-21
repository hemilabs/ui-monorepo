'use client'

import { Button } from 'components/button'
import { WalletIcon } from 'components/icons/walletIcon'
import { InformationBox } from 'components/informationBox'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

export const ConnectWallet = function () {
  const { openDrawer } = useDrawerContext()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    openDrawer?.()
    track?.('evm connect')
  }

  return (
    <InformationBox
      actions={
        <Button onClick={onClick} size="xSmall" type="button">
          {t('common.connect-wallet')}
        </Button>
      }
      icon={<WalletIcon />}
      subtitle={t('hemi-earn.transactions.connect-to-view')}
      title={t('common.your-wallet-not-connected')}
    />
  )
}
