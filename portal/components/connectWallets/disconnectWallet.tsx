import { ButtonIcon } from 'components/button'
import { DisconnectLogo } from 'components/connectedWallet/disconnectLogo'

type Props = {
  disconnect: VoidFunction
}

export const DisconnectWallet = ({ disconnect }: Props) => (
  <div className="group">
    <ButtonIcon onClick={disconnect} size="xSmall" variant="secondary">
      <DisconnectLogo className="text-neutral-500 transition-colors duration-200 group-hover:text-neutral-950" />
    </ButtonIcon>
  </div>
)
