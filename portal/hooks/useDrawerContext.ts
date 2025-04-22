import { ConnectWalletDrawerContext } from 'app/context/connectWalletDrawerContext'
import { useContext } from 'react'

export const useDrawerContext = () => useContext(ConnectWalletDrawerContext)
