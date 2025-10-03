import { EvmFeesSummary } from 'components/evmFeesSummary'
import { FeesContainer } from 'components/feesContainer'
import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { SetMaxEvmBalance } from 'components/setMaxBalance'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { FormEvent } from 'react'
import { StakingOperationRunning } from 'types/stakingDashboard'
import { Token } from 'types/token'

import { SubmitStake } from '../../submitStake'

type Props = {
  errorKey: string | undefined
  gas: {
    amount: string
    isError: boolean
    label: string
    token: Token
  }
  increaseAmountFees: bigint
  input: string
  isAllowanceError: boolean
  isAllowanceLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  onChange: (value: string) => void
  onSubmit: VoidFunction
  operationRunning: StakingOperationRunning
  total: string | undefined
  validInput: boolean
  validationError: string | undefined
}

export function Preview({
  errorKey,
  gas,
  increaseAmountFees,
  input,
  isAllowanceError,
  isAllowanceLoading,
  isRunningOperation,
  needsApproval,
  onChange,
  onSubmit,
  operationRunning,
  total,
  validationError,
  validInput,
}: Props) {
  const t = useTranslations('staking-dashboard')
  const token = useHemiToken()

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={function (e: FormEvent) {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="flex flex-1 flex-col gap-y-3 overflow-y-auto p-4 md:p-6">
        <TokenInput
          disabled={isRunningOperation}
          errorKey={errorKey}
          label={t('amount')}
          maxBalanceButton={
            <SetMaxEvmBalance
              disabled={isRunningOperation}
              gas={increaseAmountFees}
              onSetMaxBalance={onChange}
              token={token}
            />
          }
          onChange={onChange}
          showFiatBalance={false}
          token={token}
          tokenSelector={
            <TokenSelectorReadOnly logoVersion="L1" token={token} />
          }
          value={input}
        />
        {validInput && (
          <FeesContainer>
            <EvmFeesSummary gas={gas} operationToken={token} total={total} />
          </FeesContainer>
        )}
      </div>
      <CallToActionContainer>
        <div className="flex w-full [&>button]:w-full">
          <SubmitStake
            buttonSize="small"
            canStake={validInput}
            isAllowanceError={isAllowanceError}
            isAllowanceLoading={isAllowanceLoading}
            isRunningOperation={isRunningOperation}
            needsApproval={needsApproval}
            operationRunning={operationRunning}
            token={token}
            validationError={validationError}
          />
        </div>
      </CallToActionContainer>
    </form>
  )
}
