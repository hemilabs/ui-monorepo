import { parseAsStringLiteral, useQueryState } from 'nuqs'

const drawerModes = ['deposit', 'withdraw'] as const

export const useOperationDrawer = () =>
  useQueryState(
    'operation',
    parseAsStringLiteral(drawerModes).withOptions({ clearOnDefault: true }),
  )
