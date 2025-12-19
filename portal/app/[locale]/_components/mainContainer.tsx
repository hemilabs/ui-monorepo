import { NetworkType, useNetworkType } from 'hooks/useNetworkType'
import { ReactNode, Suspense } from 'react'

type Props = {
  children: ReactNode
}

const UI = ({
  children,
  networkType,
}: Props & { networkType: NetworkType }) => (
  <div
    className={`box-border h-[calc(100dvh-3.5rem)] flex-grow
          md:h-[calc(100dvh-4.25rem-1rem)]
          ${
            networkType === 'testnet'
              ? 'max-md:border-3 max-md:border-solid max-md:border-orange-600'
              : ''
          }`}
  >
    {children}
  </div>
)

const MainContainerImpl = function (props: Props) {
  const [networkType] = useNetworkType()
  return <UI {...props} networkType={networkType} />
}

// As the majority of the users will be on mainnet, prefer fallback to mainnet UI
export const MainContainer = (props: Props) => (
  <Suspense fallback={<UI {...props} networkType="mainnet" />}>
    <MainContainerImpl {...props} />
  </Suspense>
)
