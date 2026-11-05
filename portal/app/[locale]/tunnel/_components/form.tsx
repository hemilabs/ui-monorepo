import { Card } from 'components/card'
import { TokenInput } from 'components/tokenInput'
import { TokenSelector } from 'components/tokenSelector'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useTunnelTokens } from 'hooks/useTunnelTokens'
import { FormEvent, ReactNode } from 'react'
import { useTranslations } from 'use-intl'

import { useTunnelState } from '../_hooks/useTunnelState'

import { NetworkSelectors } from './networkSelectors'

type FormContentProps = {
  calculateReceiveAmount?: (input: string) => string
  errorKey: string | undefined
  isRunningOperation: boolean
  provider?: ReactNode
  setMaxBalanceButton: ReactNode
  tokenApproval?: ReactNode
  tunnelState: ReturnType<typeof useTunnelState>
}

export const FormContent = function ({
  calculateReceiveAmount = (input: string) => input,
  errorKey,
  isRunningOperation,
  provider,
  setMaxBalanceButton,
  tokenApproval,
  tunnelState,
}: FormContentProps) {
  const {
    fromInput,
    fromNetworkId,
    fromToken,
    providerType,
    toggleInput,
    toNetworkId,
    toToken,
    updateFromInput,
    updateFromNetwork,
    updateFromToken,
    updateToNetwork,
  } = tunnelState

  const t = useTranslations('tunnel-page')

  const fromTokens = useTunnelTokens(fromNetworkId)

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-x-2">
        <h2 className="capitalize">{t('title')}</h2>
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
      {provider}
      {(!provider || providerType === 'native') && (
        <div className="mb-3 flex flex-col gap-y-1.5">
          <TokenInput
            disabled={isRunningOperation}
            errorKey={errorKey}
            label={t('form.send')}
            maxBalanceButton={setMaxBalanceButton}
            onChange={updateFromInput}
            token={fromToken}
            tokenSelector={
              <TokenSelector
                disabled={isRunningOperation}
                onSelectToken={updateFromToken}
                selectedToken={fromToken}
                tokens={fromTokens}
              />
            }
            value={fromInput}
          />
          <TokenInput
            disabled={isRunningOperation}
            errorKey={errorKey}
            label={t('form.receive')}
            onChange={updateFromInput}
            token={toToken}
            tokenSelector={<TokenSelectorReadOnly token={toToken} />}
            value={calculateReceiveAmount(fromInput)}
          />
        </div>
      )}
    </>
  )
}

type TunnelFormProps = {
  bottomSection?: ReactNode
  formContent: ReactNode
  onSubmit: VoidFunction | undefined
  belowForm?: React.ReactNode
  submitButton?: ReactNode
}

export const TunnelForm = ({
  belowForm,
  bottomSection,
  formContent,
  onSubmit,
  submitButton,
}: TunnelFormProps) => (
  <div className="relative mx-auto max-w-[536px] [&>.card-container]:first:relative [&>.card-container]:first:z-10">
    <Card>
      <form
        className="flex flex-col gap-y-3 p-4 md:p-6"
        onSubmit={function (e: FormEvent) {
          // if there isn't an onSubmit function, the page reloads
          // if the user manages to submit the form (e.g., by pressing Enter)
          // that's why we prevent default behavior here
          e.preventDefault()
          onSubmit?.()
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
