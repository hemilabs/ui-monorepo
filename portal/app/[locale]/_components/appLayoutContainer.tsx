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
      backdrop-blur-20 relative flex h-full w-3/4 flex-1 flex-col self-stretch overflow-y-hidden
    bg-neutral-50/55 md:w-[calc(75%-8px)] xl:rounded-l-xl
      ${
        networkType === 'testnet'
          ? 'md:border-2 md:border-orange-600'
          : 'border-neutral-300/55 xl:border'
      }
      `}
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
