import { Card } from 'components/card'
import { DrawerLoader } from 'components/drawer/drawerLoader'
import { TokenInput } from 'components/tokenInput'
import { TokenSelector } from 'components/tokenSelector'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useCustomTokenAddress } from 'hooks/useCustomTokenAddress'
import { useHemi } from 'hooks/useHemi'
import { useTunnelTokens } from 'hooks/useTunnelTokens'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'
import { isEvmNetworkId } from 'utils/chain'

import { useTunnelState } from '../_hooks/useTunnelState'

import { NetworkSelectors } from './networkSelectors'

const CustomTokenDrawer = dynamic(
  () =>
    import('components/customTokenDrawer').then(mod => mod.CustomTokenDrawer),
  {
    loading: () => <DrawerLoader className="h-[80dvh] md:h-full" />,
    ssr: false,
  },
)

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

  const [customTokenAddress] = useCustomTokenAddress()
  const hemi = useHemi()
  const t = useTranslations('tunnel-page')

  const fromTokens = useTunnelTokens(fromNetworkId)

  const evmTunneling =
    isEvmNetworkId(fromNetworkId) && isEvmNetworkId(toNetworkId)

  const l1ChainId = fromNetworkId === hemi.id ? toNetworkId : fromNetworkId
  const l2ChainId = hemi.id

  return (
    <>
      <div className="flex items-center justify-between gap-x-2">
        <h3 className="text-xl font-medium capitalize text-neutral-950">
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
      {provider}
      {(!provider || providerType === 'native') && (
        <>
          <TokenInput
            disabled={isRunningOperation}
            errorKey={errorKey}
            label={t('form.send')}
            maxBalanceButton={setMaxBalanceButton}
            onChange={updateFromInput}
            token={fromToken}
            tokenSelector={
              <TokenSelector
                chainId={fromNetworkId}
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
          {!!customTokenAddress && evmTunneling && (
            <CustomTokenDrawer
              customTokenAddress={customTokenAddress}
              fromNetworkId={fromNetworkId}
              // @ts-expect-error TS fails to check these, but they are checked above by evmTunneling
              l1ChainId={l1ChainId}
              l2ChainId={l2ChainId}
              onSelectToken={updateFromToken}
            />
          )}
        </>
      )}
    </>
  )
}

type TunnelFormProps = {
  bottomSection?: ReactNode
  formContent: ReactNode
  onSubmit: () => void
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
