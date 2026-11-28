import { type Extensions } from 'types/token'

// LayerZero tokens have no bridgeInfo, so fall back to their peers
export const getTunnelPairs = (extensions: Extensions | undefined) =>
  extensions?.bridgeInfo ?? extensions?.oft?.peers
