import { useContext } from 'react'

import {
  type BtcContextConfig,
  BtcWalletContext,
} from '../context/btcWalletContext'

export const useConfig = function (): BtcContextConfig {
  const config = useContext(BtcWalletContext)
  if (!config) {
    throw new Error('provider not found')
  }
  return config
}
