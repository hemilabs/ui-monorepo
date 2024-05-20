import { useTranslations } from 'next-intl'
import { Card } from 'ui-common/components/card'

export const GenericError = function () {
  const t = useTranslations()
  return (
    <Card borderColor="gray" padding="large" radius="large">
      <div className="flex h-[50dvh] w-full flex-col items-center justify-center gap-y-2">
        <p className="text-base font-normal text-slate-500">
          {t('common.unexpected-error')}
        </p>
        <div className="mt-2"></div>
      </div>
    </Card>
  )
}
