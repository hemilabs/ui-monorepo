import { Button } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { useBitcoin } from 'hooks/useBitcoin'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { getTokenByAddress } from 'utils/token'

import { useShowTransactionFromPreviousStep } from '../_hooks/useShowTransactionFromPreviousStep'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import {
  BtcToHemiTunneling,
  TypedTunnelState,
  useTunnelState,
} from '../_hooks/useTunnelState'

import { ReviewBtcDeposit } from './reviewOperation/reviewBtcDeposit'

const BtcViewDeposit = function ({
  state,
}: {
  state: TypedTunnelState<BtcToHemiTunneling>
}) {
  const { partialDeposit } = state

  const bitcoin = useBitcoin()
  const deposits = useBtcDeposits()
  const hemi = useHemi()
  const t = useTranslations()
  const { txHash } = useTunnelOperation()

  const deposit = deposits.find(d => d.transactionHash === txHash)

  // If coming from the Claim form, show the Claim transaction briefly
  // but if entering from the history, there's no need to show it
  const showClaimDepositTx = useShowTransactionFromPreviousStep(
    partialDeposit?.claimDepositTxHash,
  )

  return (
    <ReviewBtcDeposit
      chain={hemi}
      isRunningOperation={false}
      submitButton={
        <ExternalLink
          href={`${bitcoin.blockExplorers.default.url}/tx/${txHash}`}
        >
          <Button type="button">{t('common.view')}</Button>
        </ExternalLink>
      }
      token={getTokenByAddress(deposit.l1Token, deposit.l1ChainId)}
      transactionsList={
        showClaimDepositTx && partialDeposit?.claimDepositTxHash
          ? [
              {
                id: 'claim',
                status: 'success',
                text: t('tunnel-page.transaction-status.deposit-claimed'),
                txHash: partialDeposit.claimDepositTxHash,
              },
            ]
          : []
      }
    />
  )
}

export const View = ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) => <BtcViewDeposit state={state as TypedTunnelState<BtcToHemiTunneling>} />
