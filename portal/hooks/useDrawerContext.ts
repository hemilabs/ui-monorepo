import { ConnectWalletDrawerContext } from 'context/connectWalletDrawerContext'
import { useContext } from 'react'

export const useDrawerContext = () => useContext(ConnectWalletDrawerContext)
