import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type useTranslations } from 'use-intl'

export const inTransitPostAction = ({
  duration,
  isCrossing,
  t,
}: {
  duration: string | undefined
  isCrossing: boolean
  t: ReturnType<typeof useTranslations<'hemi-earn.vault.drawer'>>
}) =>
  isCrossing && duration !== undefined
    ? {
        description: t('in-transit', { duration }),
        status: ProgressStatus.NOT_READY,
      }
    : undefined
