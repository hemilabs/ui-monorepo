import { DepositTunnelOperation } from 'types/tunnel'
import { isBtcDeposit } from 'utils/tunnel'

import { ReviewEvmDeposit } from './reviewEvmDeposit'

type Props = {
  deposit: DepositTunnelOperation
  onClose: () => void
}

export const ViewDeposit = function ({ deposit, onClose }: Props) {
  if (isBtcDeposit(deposit)) {
    // Will be implemented in incoming PRs
    return null
  }
  return <ReviewEvmDeposit deposit={deposit} onClose={onClose} />
}
