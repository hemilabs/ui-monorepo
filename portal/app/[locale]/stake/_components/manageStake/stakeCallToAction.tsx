import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { StakeStatusEnum, type StakeStatusEnumType } from 'types/stake'

import { CallToAction } from './callToAction'

const ProgressButton = ({ text }: { text: string }) => (
  <Button disabled size="small" type="button">
    {text}
  </Button>
)

const TryAgainButton = ({ disabled }: { disabled: boolean }) => (
  <Button disabled={disabled} size="small" type="submit">
    {useTranslations('common')('try-again')}
  </Button>
)

type Props = {
  isSubmitting: boolean
  stakeStatus: StakeStatusEnumType | undefined
}

export const StakeCallToAction = function ({
  isSubmitting,
  stakeStatus,
}: Props) {
  const t = useTranslations()

  if (stakeStatus === undefined) {
    return null
  }

  switch (stakeStatus) {
    case StakeStatusEnum.APPROVAL_TX_FAILED:
      return (
        <CallToAction
          submitButton={<TryAgainButton disabled={isSubmitting} />}
        />
      )
    case StakeStatusEnum.APPROVAL_TX_PENDING:
      return (
        <CallToAction
          submitButton={<ProgressButton text={t('common.approving')} />}
        />
      )
    case StakeStatusEnum.STAKE_TX_PENDING:
      return (
        <CallToAction
          submitButton={
            <ProgressButton text={t('stake-page.drawer.staking')} />
          }
        />
      )
    case StakeStatusEnum.STAKE_TX_FAILED:
      return (
        <CallToAction
          submitButton={<TryAgainButton disabled={isSubmitting} />}
        />
      )
    // The rest of the states render nothing
    default:
      return null
  }
}
