import { Card } from 'components/card'
import { useTranslations } from 'use-intl'

type StepProps = {
  description: string
  isLast?: boolean
  position: number
  title: string
}

const Step = ({ description, isLast = false, position, title }: StepProps) => (
  <li className="flex gap-3 md:flex-col">
    <div className="flex flex-col items-center gap-y-1 md:items-start">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xxs font-semibold lining-nums tabular-nums text-white">
        {position}
      </span>
      {isLast ? null : <div className="w-px flex-1 bg-neutral-200 md:hidden" />}
    </div>
    <div
      className={`flex min-w-0 flex-col gap-y-1 md:pb-0 md:pr-6 ${
        isLast ? '' : 'pb-4'
      }`}
    >
      <h4 className="text-orange-600">{title}</h4>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  </li>
)

export const GetStartedSection = function () {
  const t = useTranslations('hemi-stake.get-started')

  return (
    <section className="mt-8">
      <h3>{t('heading')}</h3>
      <div className="mt-4">
        <Card shadow="sm">
          <ol className="flex flex-col px-4 py-5 md:grid md:grid-cols-3 md:gap-4">
            <Step
              description={t('steps.lock.description')}
              position={1}
              title={t('steps.lock.title')}
            />
            <Step
              description={t('steps.earn.description')}
              position={2}
              title={t('steps.earn.title')}
            />
            <Step
              description={t('steps.access.description')}
              isLast
              position={3}
              title={t('steps.access.title')}
            />
          </ol>
        </Card>
      </div>
    </section>
  )
}
