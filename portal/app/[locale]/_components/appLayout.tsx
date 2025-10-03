'use client'

import { useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import React, {
  Dispatch,
  MouseEventHandler,
  SetStateAction,
  Suspense,
  useEffect,
  useState,
} from 'react'

import { AppLayoutContainer } from './appLayoutContainer'
import { Header } from './header'
import { MainContainer } from './mainContainer'
import { Navbar } from './navbar'
import { TestnetIndicator } from './testnetIndicator'

type Props = {
  children: React.ReactNode
}

const Backdrop = ({
  onClick,
}: {
  onClick: MouseEventHandler<HTMLDivElement>
}) => (
  <div
    className="absolute left-0 top-0 z-20
    h-screen w-screen bg-gradient-to-b
    from-neutral-950/0 to-neutral-950/25
    lg:hidden"
    onClick={onClick}
  />
)

// UI-less component so I can wrap it on suspense.
// Hooks can't be wrapped...
const NavBarUrlSync = function ({
  setIsMenuOpen,
}: {
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>
}) {
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()

  useEffect(
    function closeNavBarOnUrlChange() {
      setIsMenuOpen(false)
    },
    [networkType, pathname, setIsMenuOpen],
  )

  return null
}

export const AppLayout = function ({ children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNavbarOpen, setIsNavbarOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsNavbarOpen(false))

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <AppLayoutContainer>
      <Suspense>
        <NavBarUrlSync setIsMenuOpen={setIsMenuOpen} />
      </Suspense>
      <div className="relative hidden md:block">
        <TestnetIndicator />
      </div>
      <Header
        isMenuOpen={isMenuOpen}
        setIsNavbarOpen={setIsNavbarOpen}
        toggleMenu={toggleMenu}
      />
      <MainContainer hide={isMenuOpen}>
        <div className="relative md:hidden">
          <TestnetIndicator />
        </div>
        <div className="h-full overflow-y-auto">
          <div className="relative h-full overflow-x-hidden pb-3 pt-4 md:pt-12">
            {children}
          </div>
        </div>
      </MainContainer>
      {isNavbarOpen && (
        <>
          <Backdrop onClick={() => setIsNavbarOpen(false)} />
          <div
            className="z-30 ml-2 mt-2 hidden h-[calc(100dvh-16px)] rounded-xl bg-white p-1 shadow-xl md:absolute md:block lg:hidden"
            ref={ref}
          >
            <Navbar />
          </div>
        </>
      )}
      {isMenuOpen ? (
        <div className="md:hidden">
          <Navbar />
        </div>
      ) : null}
    </AppLayoutContainer>
  )
}
