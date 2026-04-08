import { parseAsStringLiteral, useQueryState } from 'nuqs'

const drawerModes = ['depositing', 'withdrawing'] as const
type DrawerModes = (typeof drawerModes)[number]

export const useDrawerVaultQueryString = function () {
  const [drawerMode, setDrawerMode] = useQueryState(
    'drawerMode',
    parseAsStringLiteral(drawerModes).withOptions({ clearOnDefault: true }),
  )

  const setDrawerQueryString = function (mode: DrawerModes | null) {
    setDrawerMode(mode)
  }

  return {
    drawerMode,
    setDrawerQueryString,
  }
}
