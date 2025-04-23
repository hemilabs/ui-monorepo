import { DepositTunnelOperation } from 'types/tunnel'
import { isBtcDeposit } from 'utils/tunnel'

import { ReviewBtcDeposit } from './reviewBtcDeposit'
import { ReviewEvmDeposit } from './reviewEvmDeposit'

type Props = {
  deposit: DepositTunnelOperation
  onClose: () => void
}

export const ViewDeposit = function ({ deposit, onClose }: Props) {
  if (isBtcDeposit(deposit)) {
    return <ReviewBtcDeposit deposit={deposit} onClose={onClose} />
  }
  return <ReviewEvmDeposit deposit={deposit} onClose={onClose} />
}
