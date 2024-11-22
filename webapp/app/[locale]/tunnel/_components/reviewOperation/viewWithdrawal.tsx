import { WithdrawTunnelOperation } from 'types/tunnel'
import { isToEvmWithdraw } from 'utils/tunnel'

import { ReviewBtcWithdrawal } from './reviewBtcWithdrawal'
import { ReviewEvmWithdrawal } from './reviewEvmWithdrawal'

type Props = {
  onClose: () => void
  withdrawal: WithdrawTunnelOperation
}

export const ViewWithdrawal = function ({ onClose, withdrawal }: Props) {
  if (isToEvmWithdraw(withdrawal)) {
    return <ReviewEvmWithdrawal onClose={onClose} withdrawal={withdrawal} />
  }
  return <ReviewBtcWithdrawal onClose={onClose} withdrawal={withdrawal} />
}
