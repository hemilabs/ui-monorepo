import { useUmami } from 'app/analyticsEvents'
import { StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useTokenBalance } from 'hooks/useBalance'
import { useTranslations } from 'next-intl'
import { type StakeOperations, type StakeToken } from 'types/stake'
import { canSubmit } from 'utils/stake'
import { parseUnits } from 'viem'

import { useAmount } from '../../_hooks/useAmount'

import { UnstakeFees } from './fees'
import { UnstakeMaxBalance } from './maxBalance'
import { Operation } from './operation'
import { Preview } from './preview'
import { SubmitButton } from './submitButton'

type Props = {
  closeDrawer: () => void
  heading: string
  onOperationChange: (op: StakeOperations) => void
  showTabs: boolean
  subheading: string
  token: StakeToken
}

// TODO implement unstake https://github.com/hemilabs/ui-monorepo/issues/755
export const UnstakeOperation = function ({
  closeDrawer,
  heading,
  showTabs,
  subheading,
  onOperationChange,
  token,
}: Props) {
  const [amount, setAmount] = useAmount()
  const tCommon = useTranslations('common')
  const { balance } = useTokenBalance(token)
  const { track } = useUmami()

  const steps: StepPropsWithoutPosition[] = []

  const submitDisabled = !!canSubmit({
    amount: parseUnits(amount, token.decimals),
    balance,
    connectedChainId: token.chainId,
    token,
  }).error

  const handleUnstake = function () {
    track?.(`stake - unstake`)
    // TODO handle unstake https://github.com/hemilabs/ui-monorepo/issues/774
  }

  const isOperating = false

  return (
    <Operation
      amount={amount}
      closeDrawer={closeDrawer}
      heading={heading}
      isOperating={isOperating}
      onSubmit={handleUnstake}
      preview={
        <Preview
          amount={amount}
          fees={<UnstakeFees />}
          isOperating={isOperating}
          maxBalance={
            <UnstakeMaxBalance
              // TODO disable when submitting https://github.com/hemilabs/ui-monorepo/issues/774
              disabled={false}
              onSetMaxBalance={setAmount}
              token={token}
            />
          }
          operation="unstake"
          setAmount={setAmount}
          setOperation={() => onOperationChange('stake')}
          showTabs={showTabs}
          submitButton={
            <SubmitButton
              // TODO disable when submitting https://github.com/hemilabs/ui-monorepo/issues/774
              disabled={submitDisabled}
              text={tCommon('unstake')}
            />
          }
          token={token}
        />
      }
      steps={steps}
      subheading={subheading}
      token={token}
    />
  )
}
