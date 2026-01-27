import { useNetworkType } from 'hooks/useNetworkType'
import { useWindowSize } from 'hooks/useWindowSize'
import { Suspense } from 'react'
import { screenBreakpoints } from 'styles'

const VideoAssetImpl = function () {
  const { width } = useWindowSize()
  const [networkType] = useNetworkType()
  const isNotTestnet = networkType !== 'testnet'

  if (width < screenBreakpoints.md) {
    return null
  }

  return (
    <div
      className={`w-54 h-30 absolute scale-150 overflow-x-hidden ${
        isNotTestnet ? '-translate-y-22' : '-translate-y-30'
      }`}
    >
      <div className="flex h-full w-[270px]">
        <video autoPlay className="h-auto w-full" loop muted preload="none">
          <source src="/navbarVideo.mp4" type="video/mp4" />
        </video>
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #FFF 0%, rgba(255, 255, 255, 0.00) 49.52%, #FFF 100%)',
        }}
      />
    </div>
  )
}
export const VideoAsset = () => (
  <Suspense>
    <VideoAssetImpl />
  </Suspense>
)
