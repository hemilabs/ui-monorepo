import { Link } from 'components/link'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import { ComponentProps, Suspense } from 'react'

const HemiSymbol = () => (
  <svg
    enableBackground="new 0 0 1080 1080"
    viewBox="0 0 1080 1080"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M436.2 1069.8c5.5 1.1 10.8-2.6 11.7-8.1L515 681.5h49.9l67 380.2c1 5.5 6.3 9.2 11.7 8.1 238-46.3 420.2-248.8 435.3-496.4v.1c0-.2.6-10.9.7-16.1 0-.6 0-1.2.1-1.7.1-2 .1-3.9.1-5.9v-2.2c0-2.5.1-5 .1-7.4v-.1c0-262.6-187.7-481.4-436.2-529.8-5.5-1.1-10.8 2.6-11.7 8.1l-67 380.1h-49.9l-67-380.2c-1-5.5-6.3-9.2-11.7-8.1C198.3 56.4 16.2 259 1 506.6v-.1c0 .2-.6 10.9-.7 16.1 0 .6 0 1.2-.1 1.7-.1 2-.1 3.9-.1 5.9v2.2c0 2.5-.1 5-.1 7.4v.1c0 262.7 187.7 481.5 436.2 529.9z"
      fill="#FF5F00"
    />
  </svg>
)

const UI = ({ href }: Pick<ComponentProps<typeof Link>, 'href'>) => (
  <Link className="h-6 w-6" href={href}>
    <HemiSymbol />
  </Link>
)

const HomeLinkImpl = function () {
  const href = useTunnelOperationByConnectedWallet()
  return <UI href={href} />
}

export const HomeLink = () => (
  // The logo link redirects to the tunnel page, but defining which operation to return to
  // (Deposit, Withdraw, etc.) depending on the connected wallet. In the initial render,
  // There is no connected wallet, so it will redirect to the tunnel page. After hydration, the
  // appropriate query string will be applied. This allow us to statically render this logo
  <Suspense fallback={<UI href="/tunnel" />}>
    <HomeLinkImpl />
  </Suspense>
)
