import { Button } from 'components/button'
import { useTranslations } from 'next-intl'

export const Actions = function () {
  const t = useTranslations()

  return (
    <div className="flex items-center gap-x-3">
      <Button size="xSmall" type="button" variant="primary">
        {t('common.deposit')}
      </Button>
      <Button size="xSmall" type="button" variant="secondary">
        {t('common.withdraw')}
      </Button>
      <Button size="xSmall" type="button" variant="secondary">
        {t('bitcoin-yield.table.claim-rewards')}
      </Button>
    </div>
  )
}
