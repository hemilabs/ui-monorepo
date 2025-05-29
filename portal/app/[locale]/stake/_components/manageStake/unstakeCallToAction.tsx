import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { UnstakeStatusEnum } from 'types/stake'

import { CallToAction } from './callToAction'

type Props = {
  isSubmitting: boolean
  unstakeStatus: UnstakeStatusEnum | undefined
}

export const UnstakeCallToAction = function ({
  isSubmitting,
  unstakeStatus,
}: Props) {
  const t = useTranslations()
  if (
    unstakeStatus === undefined ||
    unstakeStatus === UnstakeStatusEnum.UNSTAKE_TX_CONFIRMED
  ) {
    return null
  }

  if (unstakeStatus === UnstakeStatusEnum.UNSTAKE_TX_PENDING) {
    return (
      <CallToAction
        submitButton={
          <Button disabled fontSize="text-mid" type="button">
            {t('stake-page.drawer.unstaking')}
          </Button>
        }
      />
    )
  }

  // only state left is failed, and the user should try again
  return (
    <CallToAction
      submitButton={
        <Button disabled={isSubmitting} fontSize="text-mid" type="submit">
          {t('common.try-again')}
        </Button>
      }
    />
  )
}
