import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import {
  UnstakeStatusEnum,
  type StakeOperations,
  type StakeToken,
} from 'types/stake'
import { getNativeToken } from 'utils/nativeToken'
import { canSubmit } from 'utils/stake'
import { formatUnits, parseUnits } from 'viem'

import { useAmount } from '../../_hooks/useAmount'
import { useEstimateUnstakeFees } from '../../_hooks/useEstimateUnstakeFees'
import { useStakedBalance } from '../../_hooks/useStakedBalance'
import { useUnstake } from '../../_hooks/useUnstake'
import { StakeToast } from '../stakeToast'

import { Fees } from './fees'
import { UnstakeMaxBalance } from './maxBalance'
import { Operation } from './operation'
import { Preview } from './preview'
import { SubmitButton } from './submitButton'
import { UnstakeCallToAction } from './unstakeCallToAction'

const StakedBalance = dynamic(
  () => import('../stakedBalance').then(mod => mod.StakedBalance),
  {
    loading: () => (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    ),
    ssr: false,
  },
)

type Props = {
  closeDrawer: () => void
  heading: string
  onOperationChange: (op: StakeOperations) => void
  subheading: string
  token: StakeToken
}

export const UnstakeOperation = function ({
  closeDrawer,
  heading,
  onOperationChange,
  subheading,
  token,
}: Props) {
  const [amount, setAmount] = useAmount()

  const hemi = useHemi()
  const { balance, isPending: isStakedPositionPending } =
    useStakedBalance(token)
  const t = useTranslations('stake-page.drawer')
  const tCommon = useTranslations('common')
  const { isSubmitting, unstake, unstakeStatus, unStakeTransactionHash } =
    useUnstake(token)

  const canUnstake =
    !isStakedPositionPending &&
    !isSubmitting &&
    !canSubmit({
      amount: parseUnits(amount, token.decimals),
      balance,
      connectedChainId: token.chainId,
      token,
    }).error

  const unstakeEstimatedFees = useEstimateUnstakeFees({
    amount: parseUnits(amount, token.decimals),
    enabled: canUnstake,
    token,
  })

  const statusMap = {
    [UnstakeStatusEnum.UNSTAKE_TX_PENDING]: ProgressStatus.PROGRESS,
    [UnstakeStatusEnum.UNSTAKE_TX_FAILED]: ProgressStatus.FAILED,
    [UnstakeStatusEnum.UNSTAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
  }

  const unstakeStep: StepPropsWithoutPosition = {
    description: t('unstake-token', { symbol: token.symbol }),
    explorerChainId: token.chainId,
    fees:
      unstakeStatus === UnstakeStatusEnum.UNSTAKE_TX_PENDING
        ? {
            amount: formatUnits(
              unstakeEstimatedFees,
              hemi.nativeCurrency.decimals,
            ),
            token: getNativeToken(hemi.id),
          }
        : undefined,
    status: statusMap[unstakeStatus] ?? ProgressStatus.NOT_READY,
    txHash: unStakeTransactionHash,
  }

  const handleUnstake = () => unstake({ amount })

  const isOperating = unstakeStatus !== undefined

  return (
    <>
      {unstakeStatus === UnstakeStatusEnum.UNSTAKE_TX_CONFIRMED && (
        <StakeToast
          chainId={token.chainId}
          txHash={unStakeTransactionHash}
          type="unstake"
        />
      )}
      <Operation
        amount={amount}
        callToAction={
          <UnstakeCallToAction
            isSubmitting={isSubmitting}
            unstakeStatus={unstakeStatus}
          />
        }
        closeDrawer={closeDrawer}
        heading={heading}
        isOperating={isOperating}
        onSubmit={handleUnstake}
        preview={
          <Preview
            amount={amount}
            balanceComponent={StakedBalance}
            fees={<Fees estimatedFees={unstakeEstimatedFees} />}
            isOperating={isOperating}
            maxBalance={
              <UnstakeMaxBalance
                disabled={isSubmitting}
                onSetMaxBalance={setAmount}
                token={token}
              />
            }
            operation="unstake"
            setAmount={setAmount}
            setOperation={() => onOperationChange('stake')}
            showTabs
            submitButton={
              <SubmitButton
                disabled={!canUnstake}
                text={
                  isStakedPositionPending || isSubmitting
                    ? '...'
                    : tCommon('unstake')
                }
              />
            }
            token={token}
          />
        }
        steps={[unstakeStep]}
        subheading={subheading}
        token={token}
      />
    </>
  )
}
