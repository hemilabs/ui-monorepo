import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { StakeStatusEnum } from 'types/stake'

const ProgressButton = ({ text }: { text: string }) => (
  <Button disabled type="button">
    {text}
  </Button>
)

const TryAgainButton = ({ disabled }: { disabled: boolean }) => (
  <Button disabled={disabled} type="submit">
    {useTranslations('common')('try-again')}
  </Button>
)

const CallToAction = ({ submitButton }: { submitButton: ReactNode }) => (
  <div className="absolute bottom-1 left-0 right-0 flex px-4 md:px-6 [&>button]:w-full">
    <SubmitWhenConnectedToChain
      chainId={useHemi().id}
      submitButton={submitButton}
    />
  </div>
)

type Props = {
  isSubmitting: boolean
  stakeStatus: StakeStatusEnum
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
