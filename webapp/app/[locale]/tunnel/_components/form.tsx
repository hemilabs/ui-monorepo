import { Card } from 'components/card'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'

import { useTunnelState } from '../_hooks/useTunnelState'

import { NetworkSelectors } from './networkSelectors'
import { TokenInput } from './tokenInput'

const TransactionStatus = dynamic(
  () =>
    import('components/transactionStatus').then(mod => mod.TransactionStatus),
  {
    ssr: false,
  },
)

type FormContentProps = {
  setMaxBalanceButton: ReactNode
  tokenApproval?: ReactNode
  tunnelState: ReturnType<typeof useTunnelState>
  isRunningOperation: boolean
}

export const FormContent = function ({
  setMaxBalanceButton,
  tokenApproval,
  tunnelState,
  isRunningOperation,
}: FormContentProps) {
  const {
    fromNetworkId,
    fromInput,
    fromToken,
    updateFromNetwork,
    updateFromInput,
    updateFromToken,
    toNetworkId,
    updateToNetwork,
    toggleInput,
    toToken,
  } = tunnelState

  const t = useTranslations('tunnel-page')

  return (
    <>
      <div className="flex items-center justify-between gap-x-2">
        <h3 className="leading-6.5 text-xl font-medium capitalize text-neutral-950">
          {t('title')}
        </h3>
        {tokenApproval}
      </div>
      <NetworkSelectors
        fromNetworkId={fromNetworkId}
        isRunningOperation={isRunningOperation}
        toNetworkId={toNetworkId}
        toggleInput={toggleInput}
        updateFromNetwork={updateFromNetwork}
        updateToNetwork={updateToNetwork}
      />
      <TokenInput
        fromNetworkId={fromNetworkId}
        isRunningOperation={isRunningOperation}
        label={t('form.send')}
        maxBalanceButton={setMaxBalanceButton}
        onChange={updateFromInput}
        onSelectToken={updateFromToken}
        token={fromToken}
        value={fromInput}
      />
      <TokenInput
        // Tunnelling goes 1:1, so output equals input
        isRunningOperation={isRunningOperation}
        label={t('form.receive')}
        onChange={updateFromInput}
        token={toToken}
        value={fromInput}
      />
    </>
  )
}

type TunnelFormProps = {
  bottomSection?: ReactNode
  // TODO remove after all modals are replaced with drawers
  explorerUrl?: string
  formContent: ReactNode
  onSubmit: () => void
  belowForm?: React.ReactNode
  submitButton?: ReactNode
  // TODO remove after all modals are replaced with drawers
  transactionsList?: {
    id: string
    status: React.ComponentProps<typeof TransactionStatus>['status']
    text: string
    txHash: string
  }[]
}

export const TunnelForm = ({
  bottomSection,
  formContent,
  onSubmit,
  belowForm,
  submitButton,
}: TunnelFormProps) => (
  <div className="mx-auto max-w-[536px]">
    <Card>
      <form
        className="flex flex-col gap-y-3 p-4 md:p-6"
        onSubmit={function (e: FormEvent) {
          e.preventDefault()
          onSubmit()
        }}
      >
        {formContent}
        {submitButton}
        {bottomSection}
      </form>
    </Card>
    {belowForm}
  </div>
)
