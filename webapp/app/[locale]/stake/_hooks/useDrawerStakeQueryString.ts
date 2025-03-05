import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
<<<<<<< Updated upstream
=======
import { Address } from 'viem'
>>>>>>> Stashed changes

const drawerModes = ['manage', 'stake'] as const
export type DrawerModes = (typeof drawerModes)[number]

export const useDrawerStakeQueryString = function () {
  const [tokenAddress, setTokenAddress] = useQueryState(
    'tokenAddress',
    parseAsString.withOptions({ clearOnDefault: true }),
  )

  const [drawerMode, setDrawerMode] = useQueryState(
    'drawerMode',
    parseAsStringLiteral(drawerModes).withOptions({ clearOnDefault: true }),
  )

  const setDrawerQueryString = function (
    mode: DrawerModes | null,
    address: string | null,
  ) {
    setDrawerMode(mode)
    setTokenAddress(address)
  }

  return {
    drawerMode,
    setDrawerQueryString,
    tokenAddress,
  }
}
