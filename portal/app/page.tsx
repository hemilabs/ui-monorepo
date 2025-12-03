import { featureFlags } from 'app/featureFlags'
import { redirect } from 'next/navigation'

export default function RootPage() {
  const target = featureFlags.enableBtcYieldPage ? '/btc-yield' : '/tunnel'
  redirect(target)
}
