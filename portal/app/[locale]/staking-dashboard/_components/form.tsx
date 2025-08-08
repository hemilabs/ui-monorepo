import { Card } from 'components/card'
import { TokenInput } from 'components/tokenInput'
import { TokenLogo } from 'components/tokenLogo'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'

import { useStakingDashboardState } from '../_hooks/useStakingDashboardState'

import { Lockup } from './lockup'

type FormTokenProps = {
  stakingDashboardState: ReturnType<typeof useStakingDashboardState>
}

function FormToken({ stakingDashboardState }: FormTokenProps) {
  const { token } = stakingDashboardState
  return (
    <div className="flex items-center gap-x-2 text-base">
      <TokenLogo size="small" token={token} />
      <span className="text-neutral-950">{token.symbol}</span>
    </div>
  )
}

type FormContentProps = {
  errorKey: string | undefined
  isRunningOperation: boolean
  setMaxBalanceButton: ReactNode
  stakingDashboardState: ReturnType<typeof useStakingDashboardState>
}

export const FormContent = function ({
  errorKey,
  isRunningOperation,
  setMaxBalanceButton,
  stakingDashboardState,
}: FormContentProps) {
  const { input, token, updateInput } = stakingDashboardState

  const t = useTranslations('staking-dashboard')

  return (
    <>
      <div className="flex items-center justify-between gap-x-2">
        <h3 className="text-xl font-medium capitalize text-neutral-950">
          {t('form.title')}
        </h3>
      </div>
      <TokenInput
        disabled={isRunningOperation}
        errorKey={errorKey}
        label={t('amount')}
        maxBalanceButton={setMaxBalanceButton}
        onChange={updateInput}
        token={token}
        tokenSelector={
          <FormToken stakingDashboardState={stakingDashboardState} />
        }
        value={input}
      />
      <Lockup stakingDashboardState={stakingDashboardState} />
    </>
  )
}

type StakingDashboardFormProps = {
  bottomSection?: ReactNode
  formContent: ReactNode
  onSubmit: () => void
  belowForm?: React.ReactNode
  submitButton?: ReactNode
}

export const StakingForm = ({
  belowForm,
  bottomSection,
  formContent,
  onSubmit,
  submitButton,
}: StakingDashboardFormProps) => (
  <div className="relative mx-auto max-w-[536px] [&>.card-container]:first:relative [&>.card-container]:first:z-10">
    <Card>
      <form
        className="flex flex-col p-4 md:p-6"
        onSubmit={function (e: FormEvent) {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className="flex flex-col gap-y-3">{formContent}</div>
        <div className="mt-10 w-full [&>*]:w-full">{submitButton}</div>
        {bottomSection}
      </form>
    </Card>
    {belowForm}
  </div>
)
