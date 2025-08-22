import { useHemiToken } from 'app/[locale]/genesis-drop/_hooks/useHemiToken'
import { Card } from 'components/card'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'

import { useStakingDashboard } from '../_context/stakingDashboardContext'

import { Lockup } from './lockup'

type FormContentProps = {
  errorKey: string | undefined
  isRunningOperation: boolean
  setMaxBalanceButton: ReactNode
}

export const FormContent = function ({
  errorKey,
  isRunningOperation,
  setMaxBalanceButton,
}: FormContentProps) {
  const token = useHemiToken()
  const { input, updateInput } = useStakingDashboard()

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
        showFiatBalance={false}
        token={token}
        tokenSelector={<TokenSelectorReadOnly logoVersion="L1" token={token} />}
        value={input}
      />
      <Lockup />
    </>
  )
}

type StakingDashboardFormProps = {
  bottomSection?: ReactNode
  formContent: ReactNode
  onSubmit: VoidFunction
  belowForm?: ReactNode
  submitButton?: ReactNode
}

export const StakingForm = ({
  belowForm,
  bottomSection,
  formContent,
  onSubmit,
  submitButton,
}: StakingDashboardFormProps) => (
  <div className="relative mx-auto w-full lg:max-w-[536px] [&>.card-container]:first:relative [&>.card-container]:first:z-10">
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
