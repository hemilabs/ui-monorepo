import { Button } from 'components/button'
import { WarningBox } from 'components/warningBox'
import { useTranslations } from 'use-intl'

export const TransactionsLoadError = function ({
  onRetry,
}: {
  onRetry: VoidFunction
}) {
  const t = useTranslations()
  return (
    <div role="alert">
      <WarningBox
        heading={t('hemi-earn.transactions.could-not-load-all-transactions')}
        subheading={t('common.unexpected-error')}
      >
        <div className="mt-2 flex">
          <Button onClick={onRetry} size="xSmall" type="button">
            {t('common.try-again')}
          </Button>
        </div>
      </WarningBox>
    </div>
  )
}
