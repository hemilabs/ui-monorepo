import dynamic from 'next/dynamic'
import useLocalStorageState from 'use-local-storage-state'

const GetStarted = dynamic(
  () => import('./getStarted').then(mod => mod.GetStarted),
  {
    ssr: false,
  },
)

export const GetStartedLoader = function () {
  const [hideGetStarted, setHideGetStarted] = useLocalStorageState(
    'portal.hide-bitcoin-yield-get-started',
    {
      defaultValue: false,
    },
  )

  if (hideGetStarted) {
    return null
  }
  return <GetStarted onClose={() => setHideGetStarted(true)} />
}
