import { Button } from 'components/button'
import { WalletIcon } from 'components/icons/walletIcon'
import { TableEmptyState } from 'components/tableEmptyState'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useHemiToken } from 'hooks/useHemiToken'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

export const ConnectWallet = function () {
  const { openDrawer } = useDrawerContext()
  const t = useTranslations()
  const { track } = useUmami()
  const { symbol } = useHemiToken()

  const onClick = function () {
    openDrawer?.()
    track?.('evm connect')
  }

  return (
    <TableEmptyState
      action={
        <Button onClick={onClick} size="xSmall" type="button">
          {t('common.connect-wallet')}
        </Button>
      }
      icon={<WalletIcon />}
      subtitle={t('staking-dashboard.table.connect-to-stake', { symbol })}
      title={t('common.your-wallet-not-connected')}
    />
  )
}
