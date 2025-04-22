import { Card } from 'components/card'
import { useTranslations } from 'next-intl'

export const GenericError = function () {
  const t = useTranslations()
  return (
    <Card>
      <div className="flex h-[50dvh] w-full flex-col items-center justify-center gap-y-2 p-6 md:p-9">
        <p className="text-base font-normal text-slate-500">
          {t('common.unexpected-error')}
        </p>
        <div className="mt-2"></div>
      </div>
    </Card>
  )
}
