import { Card } from 'components/card'
import { SwitchToNetworkToast } from 'components/switchToNetworkToast'
import { useCustomTokenAddress } from 'hooks/useCustomTokenAddress'
import { useHemi } from 'hooks/useHemi'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'

import { useToastIfNotConnectedTo } from '../_hooks/useToastIfNotConnectedTo'
import { useTunnelState } from '../_hooks/useTunnelState'

import { NetworkSelectors } from './networkSelectors'
import { TokenInput } from './tokenInput'

const CustomTokenDrawer = dynamic(() =>
  import('components/customTokenDrawer').then(mod => mod.CustomTokenDrawer),
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const [customTokenAddress] = useCustomTokenAddress()
  const hemi = useHemi()
  const t = useTranslations('tunnel-page')

  const showToast = useToastIfNotConnectedTo(fromNetworkId)

  const evmTunneling =
    typeof fromNetworkId === 'number' && typeof toNetworkId === 'number'

  const l1ChainId = fromNetworkId === hemi.id ? toNetworkId : fromNetworkId
  const l2ChainId = fromNetworkId === l1ChainId ? toNetworkId : fromNetworkId

  return (
    <>
      {showToast && <SwitchToNetworkToast chainId={fromNetworkId} />}
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

      {!!customTokenAddress && evmTunneling && (
        <CustomTokenDrawer
          fromNetworkId={fromNetworkId}
          // @ts-expect-error TS fails to check these, but they are checked above by evmTunneling
          l1ChainId={l1ChainId}
          // @ts-expect-error TS fails to check these, but they are checked above by evmTunneling
          l2ChainId={l2ChainId}
          onSelectToken={updateFromToken}
        />
      )}
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
