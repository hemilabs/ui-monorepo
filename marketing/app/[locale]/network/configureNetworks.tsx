'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

type NetworkConfiguration = 'automatic' | 'manual'

const useSelectedTab = function (
  defaultConfiguration: NetworkConfiguration = 'automatic',
) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(
    function redirectToDefaultConfigurationIfInvalid() {
      if (
        ['automatic', 'manual'].some(
          c => searchParams.get('networkConfiguration') === c,
        )
      ) {
        return undefined
      }
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      current.append('networkConfiguration', defaultConfiguration)
      router.push(`${pathname}?${current.toString()}`)
      return undefined
    },
    [defaultConfiguration, pathname, router, searchParams],
  )

  return (searchParams.get('networkConfiguration') ??
    defaultConfiguration) as NetworkConfiguration
}

type TabProps = {
  active: boolean
  networkConfiguration: NetworkConfiguration
}
const Tab = function ({ active, networkConfiguration }: TabProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const t = useTranslations()

  return (
    <li>
      <Link
        className={`${
          active
            ? 'cursor-default border-b-2 border-black font-medium text-black '
            : 'cursor-pointer font-normal text-neutral-400 hover:border-b hover:border-gray-300 hover:text-gray-600'
        } my-2 inline-block py-2`}
        href={{
          pathname,
          query: {
            ...Object.fromEntries(searchParams.entries()),
            networkConfiguration,
          },
        }}
        shallow
      >
        {t(`network.${networkConfiguration}`)}
      </Link>
    </li>
  )
}

const AutomaticConfiguration = function () {
  return <span>Automatic configuration TBD</span>
}

const ManualConfiguration = function () {
  return <span>Manual configuration TBD</span>
}

export const ConfigureNetwork = function () {
  const t = useTranslations()

  const networkConfiguration = useSelectedTab('automatic')

  return (
    <div className="flex flex-col">
      <h4 className="text-xl">{t('network.configure-sepolia-testnet')}</h4>
      <div className="text-center text-sm">
        <ul className="flex flex-wrap gap-x-4">
          <Tab
            active={networkConfiguration === 'automatic'}
            networkConfiguration="automatic"
          />
          <Tab
            active={networkConfiguration === 'manual'}
            networkConfiguration="manual"
          />
        </ul>
      </div>
      {/* some template to show the space the implementation will take */}
      {/* TODO https://github.com/BVM-priv/ui-monorepo/issues/46 */}
      <div className="h-[200px]">
        {networkConfiguration === 'automatic' && <AutomaticConfiguration />}
        {networkConfiguration === 'manual' && <ManualConfiguration />}
      </div>
    </div>
  )
}
