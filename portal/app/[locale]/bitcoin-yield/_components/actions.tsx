import { Button } from 'components/button'
import { useTranslations } from 'next-intl'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'

export const Actions = function () {
  const t = useTranslations()
  const [, setOperationDrawer] = useOperationDrawer()

  const commonProps = {
    size: 'xSmall',
    type: 'button',
  } as const

  return (
    <div className="flex items-center gap-x-3">
      <Button
        {...commonProps}
        onClick={() => setOperationDrawer('deposit')}
        variant="primary"
      >
        {t('common.deposit')}
      </Button>
      <Button {...commonProps} variant="secondary">
        {t('common.withdraw')}
      </Button>
      <Button {...commonProps} variant="secondary">
        {t('bitcoin-yield.table.claim-rewards')}
      </Button>
    </div>
  )
}
