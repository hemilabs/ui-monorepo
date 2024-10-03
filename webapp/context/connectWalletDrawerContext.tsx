'use client'

import { createContext, ReactNode, useState } from 'react'

type ConnectWalletDrawerContext = {
  closeDrawer: () => void
  isDrawerOpen: boolean
  openDrawer: () => void
}

export const ConnectWalletDrawerContext =
  createContext<ConnectWalletDrawerContext>({
    closeDrawer: () => undefined,
    isDrawerOpen: false,
    openDrawer: () => undefined,
  })

export const ConnectWalletDrawerProvider = function ({
  children,
}: {
  children: ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const openDrawer = () => setIsDrawerOpen(true)
  const closeDrawer = () => setIsDrawerOpen(false)

  return (
    <ConnectWalletDrawerContext.Provider
      value={{ closeDrawer, isDrawerOpen, openDrawer }}
    >
      {children}
    </ConnectWalletDrawerContext.Provider>
  )
}
