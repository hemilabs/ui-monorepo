import { Button } from 'components/button'
import { WarningIcon } from 'components/icons/warningIcon'
import { InformationBox } from 'components/informationBox'
import { useTranslations } from 'use-intl'

type Props = {
  onRetry: VoidFunction
  title: string
}

export function DataUnavailable({ onRetry, title }: Props) {
  const t = useTranslations()

  return (
    <div className="size-full" role="alert">
      <InformationBox
        actions={
          <Button onClick={onRetry} size="xSmall" type="button">
            {t('common.try-again')}
          </Button>
        }
        icon={<WarningIcon className="text-orange-600" />}
        subtitle={t('common.unexpected-error')}
        title={title}
      />
    </div>
  )
}
