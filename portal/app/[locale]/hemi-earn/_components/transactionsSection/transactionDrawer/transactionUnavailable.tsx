import { DataUnavailable } from 'components/dataUnavailable'
import { useDrawerAnimatedClose } from 'components/drawer'
import { useTranslations } from 'use-intl'

export const TransactionUnavailable = function ({
  onClose,
  onRetry,
}: {
  onClose: VoidFunction
  onRetry: VoidFunction
}) {
  const t = useTranslations('hemi-earn.transactions')
  const requestClose = useDrawerAnimatedClose() ?? onClose
  return (
    <div className="drawer-content h-[80dvh] md:h-full">
      <DataUnavailable
        onClose={requestClose}
        onRetry={onRetry}
        title={t('could-not-load-transactions')}
      />
    </div>
  )
}
