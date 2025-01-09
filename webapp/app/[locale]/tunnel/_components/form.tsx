import { Card } from 'components/card'
import { SwitchToNetworkToast } from 'components/switchToNetworkToast'
import { useCustomTokenAddress } from 'hooks/useCustomTokenAddress'
import { useHemi } from 'hooks/useHemi'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'
import { isEvmNetworkId } from 'utils/chain'

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
  isRunningOperation: boolean
  minInputMsg?: string
  setMaxBalanceButton: ReactNode
  tokenApproval?: ReactNode
  tunnelState: ReturnType<typeof useTunnelState>
}

export const FormContent = function ({
  isRunningOperation,
  minInputMsg,
  setMaxBalanceButton,
  tokenApproval,
  tunnelState,
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

  const showFromToast = useToastIfNotConnectedTo(fromNetworkId)
  const showToToast = useToastIfNotConnectedTo(toNetworkId)

  const evmTunneling =
    isEvmNetworkId(fromNetworkId) && isEvmNetworkId(toNetworkId)

  const l1ChainId = fromNetworkId === hemi.id ? toNetworkId : fromNetworkId
  const l2ChainId = hemi.id

  return (
    <>
      {/* For Evm<->Evm tunneling, the relevant chain is the "from" - as the user must be connected
        to that chain, and nothing else. For Evm<->Btc, the user needs to be connected to 2 wallets.
        So we must check that the connected EVM wallet is a hemi one (And the correct one)
        and that the BTC wallet connected is the appropriate. */}
      {showFromToast && <SwitchToNetworkToast chainId={fromNetworkId} />}
      {/* adding !showFromToast so we don't show 2 toast at the same */}
      {showToToast && !showFromToast && !evmTunneling && (
        <SwitchToNetworkToast chainId={toNetworkId} />
      )}
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
        minInputMsg={minInputMsg}
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
