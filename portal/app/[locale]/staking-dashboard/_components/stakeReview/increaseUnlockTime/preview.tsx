import { DrawerSection } from 'components/drawer'
import { EvmFeesSummary } from 'components/evmFeesSummary'
import { FeesContainer } from 'components/feesContainer'
import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { Step, StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemiToken } from 'hooks/useHemiToken'
import { FormEvent, ReactNode } from 'react'
import { type StakingOperationRunning } from 'types/stakingDashboard'
import { Token } from 'types/token'

import { Lockup } from '../../lockup'
import { SubmitStake } from '../../submitStake'

type PreviewProps = {
  callToAction: ReactNode
  gas: {
    amount: string
    isError: boolean
    label: string
    token: Token
  }
  input: string
  inputDays: string
  isRunningOperation: boolean
  isValid: boolean
  lockupDays: number
  minLocked?: number
  onSubmit: VoidFunction
  onUpdateInputDays: (value: string) => void
  onUpdateLockupDays: (value: number) => void
  operationRunning: StakingOperationRunning
  steps: StepPropsWithoutPosition[]
}

export function Preview({
  callToAction,
  gas,
  input,
  inputDays,
  isRunningOperation,
  isValid,
  lockupDays,
  minLocked,
  onSubmit,
  onUpdateInputDays,
  onUpdateLockupDays,
  operationRunning,
  steps,
}: PreviewProps) {
  const token = useHemiToken()
  return (
    <div className="skip-parent-padding-x relative h-full overflow-hidden">
      <div
        className={`absolute inset-0 flex flex-col overflow-y-hidden transition-transform duration-500 ${
          operationRunning !== 'idle'
            ? 'invisible -translate-x-full'
            : 'translate-x-0'
        }`}
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={function (e: FormEvent) {
            e.preventDefault()
            onSubmit()
          }}
        >
          <div className="flex flex-1 flex-col gap-y-3 overflow-y-auto p-4 md:p-6">
            <Lockup
              input={input}
              inputDays={inputDays}
              lockupDays={lockupDays}
              minLocked={minLocked}
              updateInputDays={onUpdateInputDays}
              updateLockupDays={onUpdateLockupDays}
            />
            {isValid && (
              <FeesContainer>
                <EvmFeesSummary gas={gas} operationToken={token} />
              </FeesContainer>
            )}
          </div>
          <CallToActionContainer>
            <div className="flex w-full [&>button]:w-full">
              <SubmitStake
                buttonSize="small"
                canStake={isValid}
                isAllowanceError={false}
                isAllowanceLoading={false}
                isRunningOperation={isRunningOperation}
                needsApproval={false}
                operationRunning={operationRunning}
                token={token}
                validationError={undefined}
              />
            </div>
          </CallToActionContainer>
        </form>
      </div>
      <div
        className={`absolute inset-0 flex flex-col pb-1 transition-transform duration-500 ${
          operationRunning !== 'idle' ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="skip-parent-padding-x mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
          <DrawerSection>
            <div
              className="mt-4 flex flex-col gap-y-8"
              style={{ height: `${144 * steps.length + 20}px` }}
            >
              {steps.map((stepProps, index) => (
                <Step key={index} position={index + 1} {...stepProps} />
              ))}
            </div>
          </DrawerSection>
        </div>
        <CallToActionContainer>{callToAction}</CallToActionContainer>
      </div>
    </div>
  )
}
