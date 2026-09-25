import { Button } from 'components/button'
import { WarningIcon } from 'components/icons/warningIcon'
import { InformationBox } from 'components/informationBox'
import { Spinner } from 'components/spinner'
import { useTranslations } from 'use-intl'

type Props = {
  isRetrying: boolean
  onRetry: VoidFunction
}

export function PositionsUnavailable({ isRetrying, onRetry }: Props) {
  const t = useTranslations()

  return (
    <div className="size-full" role="alert">
      <InformationBox
        actions={
          <Button
            disabled={isRetrying}
            onClick={onRetry}
            size="xSmall"
            type="button"
          >
            {isRetrying ? <Spinner size={16} /> : null}
            {t('common.try-again')}
          </Button>
        }
        icon={<WarningIcon className="text-orange-600" />}
        subtitle={t('common.unexpected-error')}
        title={t('hemi-stake.table.could-not-load-positions')}
      />
    </div>
  )
}
