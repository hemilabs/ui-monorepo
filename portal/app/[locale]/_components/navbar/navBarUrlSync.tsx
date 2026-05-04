import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useEffect } from 'react'

type Props = {
  closeNavbar: VoidFunction
}

// UI-less component so I can wrap it on suspense.
// Hooks can't be wrapped...

export const NavBarUrlSync = function ({ closeNavbar }: Props) {
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()

  useEffect(
    function closeNavBarOnUrlChangeMobile() {
      closeNavbar()
    },
    [closeNavbar, networkType, pathname],
  )
  return null
}
