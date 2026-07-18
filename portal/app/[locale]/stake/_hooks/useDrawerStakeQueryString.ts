import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'

const drawerModes = ['manage', 'stake'] as const
export type DrawerModes = (typeof drawerModes)[number]

// Needed on top of the parser's validation: nuqs syncs values set by other
// hooks sharing the "drawerMode" url key (other pages define their own modes
// for it) without re-parsing, so an invalid value can reach consumers.
export const isDrawerMode = (value: string | null): value is DrawerModes =>
  drawerModes.includes(value as DrawerModes)

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
