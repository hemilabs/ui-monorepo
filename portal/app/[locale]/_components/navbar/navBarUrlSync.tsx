import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { Dispatch, SetStateAction, useEffect } from 'react'

type Props = {
  setIsNavbarOpen: Dispatch<SetStateAction<boolean>>
}

export const NavBarUrlSync = function ({ setIsNavbarOpen }: Props) {
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()

  useEffect(
    function closeNavBarOnUrlChangeMobile() {
      setIsNavbarOpen(false)
    },
    [networkType, pathname, setIsNavbarOpen],
  )
  return null
}
