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
    className={`
      shadow-hemi-layout backdrop-blur-20 relative flex h-full
      w-3/4 flex-1 flex-col self-stretch overflow-y-hidden bg-neutral-50 lg:h-[calc(100dvh-16px)]
      ${
        networkType === 'testnet'
          ? 'md:border-2 md:border-orange-500'
          : 'border-neutral-300/55 lg:border'
      }
      md:my-0 md:mr-0 md:w-[calc(75%-8px)] lg:my-2 lg:mr-2 lg:rounded-2xl`}
    id="app-layout-container"
  >
    {children}
  </div>
)

const AppLayoutContainerImpl = function (props: Props) {
  const [networkType] = useNetworkType()
  return <UI {...props} networkType={networkType} />
}

// As the majority of the users will be on mainnet, prefer fallback to mainnet UI
export const AppLayoutContainer = (props: Props) => (
  <Suspense fallback={<UI networkType="mainnet" {...props} />}>
    <AppLayoutContainerImpl {...props} />
  </Suspense>
)
