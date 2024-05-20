import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card } from 'ui-common/components/card'

type Props = {
  heading: string
  subheading: string
}

export const ConnectWallet = ({ heading, subheading }: Props) => (
  <Card borderColor="gray" padding="large" radius="large">
    <div className="flex h-[50dvh] w-full flex-col items-center justify-center gap-y-2">
      <h3 className="text-2xl font-normal text-black">{heading}</h3>
      <p className="text-center text-base font-normal text-slate-500">
        {subheading}
      </p>
      <div className="mt-2">
        <ConnectButton />
      </div>
    </div>
  </Card>
)
