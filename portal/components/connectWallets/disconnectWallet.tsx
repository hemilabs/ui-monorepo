import { Button } from 'components/button'
import { DisconnectLogo } from 'components/connectedWallet/disconnectLogo'

type Props = {
  disconnect: VoidFunction
}

export const DisconnectWallet = ({ disconnect }: Props) => (
  <Button onClick={disconnect} size="xSmall" variant="secondary">
    <DisconnectLogo />
  </Button>
)
