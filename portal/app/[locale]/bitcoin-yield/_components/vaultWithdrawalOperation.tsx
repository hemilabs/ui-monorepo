'use client'

import { Button } from 'components/button'
import { HemiFees } from 'components/hemiFees'
import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { ToastLoader } from 'components/toast/toastLoader'
import { validateInput } from 'components/tokenInput/utils'
import { useHemi } from 'hooks/useHemi'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import { useEstimateWithdrawFees } from '../_hooks/useEstimateWithdrawFees'
import { usePoolAsset } from '../_hooks/usePoolAsset'
import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'
import { useWithdraw } from '../_hooks/useWithdraw'
import {
  BitcoinYieldWithdrawalOperation,
  BitcoinYieldWithdrawalStatus,
  type BitcoinYieldWithdrawalStatusType,
} from '../_types'

import { Operation } from './operation'
import { Preview } from './preview'
import { SubmitWithdraw } from './submitWithdraw'
import { UserPoolBalance } from './userPoolBalance'
import { WithdrawMaxBalance } from './withdrawMaxBalance'

const SuccessToast = dynamic(
  () => import('./successToast').then(mod => mod.SuccessToast),
  {
    loading: () => <ToastLoader />,
    ssr: false,
  },
)

type Props = {
  input: string
  onAmountChange: (input: string) => void
  onClose: VoidFunction
}

export const VaultWithdrawalOperation = function ({
  input,
  onAmountChange,
  onClose,
}: Props) {
  const [vaultWithdrawalOperation, setVaultWithdrawalOperation] = useState<
    BitcoinYieldWithdrawalOperation | undefined
  >()

  const hemi = useHemi()
  const { data: token } = usePoolAsset()
  const {
    isPending,
    isSuccess,
    mutate: withdraw,
  } = useWithdraw({
    input,
    updateBitcoinYieldOperation: newStatus =>
      setVaultWithdrawalOperation(prev =>
        prev ? { ...prev, ...newStatus } : newStatus,
      ),
  })

  const { data: userPoolBalance } = useUserPoolBalance()

  const withdrawalStatus = vaultWithdrawalOperation?.status

  const t = useTranslations()

  const amount = parseTokenUnits(input, token)

  const { fees: withdrawGasFees, isError: isWithdrawFeesError } =
    useEstimateWithdrawFees({
      assets: amount,
      enabled:
        withdrawalStatus === BitcoinYieldWithdrawalStatus.WITHDRAW_TX_PENDING ||
        withdrawalStatus === BitcoinYieldWithdrawalStatus.WITHDRAW_TX_FAILED ||
        withdrawalStatus === undefined,
    })

  const getStepFees = ({
    fee,
    isError,
    show,
  }: {
    fee: bigint
    show: boolean
    isError: boolean
  }): StepPropsWithoutPosition['fees'] =>
    show
      ? {
          amount: formatUnits(fee, hemi.nativeCurrency.decimals),
          isError,
          token: getNativeToken(hemi.id),
        }
      : undefined

  const addWithdrawStep = function (): StepPropsWithoutPosition {
    const getStatus = function () {
      if (withdrawalStatus === undefined) {
        return ProgressStatus.READY
      }
      const statusMap: Record<
        BitcoinYieldWithdrawalStatusType,
        ProgressStatusType
      > = {
        [BitcoinYieldWithdrawalStatus.WITHDRAW_TX_PENDING]:
          ProgressStatus.PROGRESS,
        [BitcoinYieldWithdrawalStatus.WITHDRAW_TX_FAILED]:
          ProgressStatus.FAILED,
        [BitcoinYieldWithdrawalStatus.WITHDRAW_TX_CONFIRMED]:
          ProgressStatus.COMPLETED,
      }
      return statusMap[withdrawalStatus]
    }

    const showFees =
      withdrawalStatus === BitcoinYieldWithdrawalStatus.WITHDRAW_TX_PENDING ||
      withdrawalStatus === BitcoinYieldWithdrawalStatus.WITHDRAW_TX_FAILED ||
      withdrawalStatus === undefined

    return {
      description: (
        <ChainLabel
          active={
            withdrawalStatus ===
            BitcoinYieldWithdrawalStatus.WITHDRAW_TX_PENDING
          }
          chainId={hemi.id}
          label={t('bitcoin-yield.drawer.withdraw-btc', {
            symbol: token.symbol,
          })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: withdrawGasFees,
        isError: isWithdrawFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: vaultWithdrawalOperation?.transactionHash,
    }
  }

  const steps: StepPropsWithoutPosition[] = [addWithdrawStep()]

  const getFeeProps = () => ({
    fees: withdrawGasFees ?? BigInt(0),
    isError: isWithdrawFeesError,
  })

  const {
    error: validationError,
    errorKey,
    isValid: isSubmitValid,
  } = validateInput({
    amountInput: input,
    balance: userPoolBalance ?? BigInt(0),
    operation: 'withdrawal',
    t,
    token,
  })

  const balanceLoaded = userPoolBalance !== undefined

  const canWithdraw = balanceLoaded && isSubmitValid

  const handleWithdraw = function () {
    if (canWithdraw) {
      withdraw()
    }
  }

  const getCallToAction = (
    status: BitcoinYieldWithdrawalStatusType | undefined,
  ) =>
    status === BitcoinYieldWithdrawalStatus.WITHDRAW_TX_FAILED ? (
      <div className="w-full [&>button]:w-full">
        <Button
          disabled={isPending}
          onClick={handleWithdraw}
          size="small"
          type="button"
          variant="primary"
        >
          {t('common.try-again')}
        </Button>
      </div>
    ) : null

  const renderToast = () =>
    vaultWithdrawalOperation?.status ===
      BitcoinYieldWithdrawalStatus.WITHDRAW_TX_CONFIRMED && (
      <SuccessToast
        description={t('bitcoin-yield.toast.your-withdrawal-was-successful')}
        title={t('bitcoin-yield.toast.withdraw-confirmed')}
        txHash={vaultWithdrawalOperation.transactionHash!}
      />
    )

  return (
    <>
      {renderToast()}
      <Operation
        amount={input}
        callToAction={getCallToAction(withdrawalStatus)}
        heading={t('bitcoin-yield.drawer.withdraw-heading')}
        isOperating={isPending || isSuccess}
        onClose={onClose}
        onSubmit={handleWithdraw}
        preview={
          <Preview
            amount={input}
            balanceComponent={UserPoolBalance}
            errorKey={balanceLoaded ? errorKey : undefined}
            fees={<HemiFees {...getFeeProps()} />}
            isOperating={isPending}
            maxBalance={
              <WithdrawMaxBalance
                disabled={isPending}
                onSetMaxBalance={onAmountChange}
                token={token}
              />
            }
            setAmount={onAmountChange}
            submitButton={
              <SubmitWithdraw
                canWithdraw={canWithdraw}
                isRunningOperation={isPending}
                token={token}
                validationError={validationError}
              />
            }
            token={token}
          />
        }
        steps={steps}
        subheading={t('bitcoin-yield.drawer.withdraw-subheading', {
          symbol: token.symbol,
        })}
        token={token}
      />
    </>
  )
}
