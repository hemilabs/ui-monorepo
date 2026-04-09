'use client'

import { useOnClickOutside } from '@hemilabs/react-hooks/useOnClickOutside'
import { useOnKeyUp } from '@hemilabs/react-hooks/useOnKeyUp'
import { CloseIcon } from 'components/icons/closeIcon'
import {
  ComponentType,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import ReactDOM from 'react-dom'
import { getDrawerPortalContainer } from 'utils/document'

import { Overlay } from '../overlay'

const DrawerAnimatedCloseContext = createContext<VoidFunction | undefined>(
  undefined,
)

type Props = {
  children: React.ReactNode
  container?: HTMLElement
  onClose?: VoidFunction
  overlay?: ComponentType
  position?: 'left' | 'right'
}

export const Drawer = function ({
  children,
  container,
  onClose,
  overlay: OverlayComponent = Overlay,
  position = 'right',
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const closingStartedRef = useRef(false)
  const suppressOutsideCloseRef = useRef(true)

  useEffect(function allowOutsideCloseAfterOpenClick() {
    const id = window.setTimeout(function enableOutsideClose() {
      suppressOutsideCloseRef.current = false
    }, 0)
    return function cancelOutsideCloseTimer() {
      window.clearTimeout(id)
    }
  }, [])

  useEffect(function scheduleDrawerOpen() {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setIsOpen(true)),
    )
    return function cancelRaf() {
      cancelAnimationFrame(id)
    }
  }, [])

  const handleClose = useCallback(
    function closeDrawer() {
      if (onClose && !closingStartedRef.current) {
        closingStartedRef.current = true
        setIsOpen(false)
      }
    },
    [onClose],
  )

  const handleOutsideClose = useCallback(
    function onClickOutsideDrawer() {
      if (suppressOutsideCloseRef.current) {
        return
      }
      handleClose()
    },
    [handleClose],
  )

  const handleTransitionEnd = useCallback(
    function onPanelTransitionEnd(
      event: React.TransitionEvent<HTMLDivElement>,
    ) {
      const isPanel = event.target === event.currentTarget
      const isTransform = event.propertyName === 'transform'
      const closingAnimFinished =
        isPanel && isTransform && !isOpen && closingStartedRef.current
      if (closingAnimFinished) {
        closingStartedRef.current = false
        onClose?.()
      }
    },
    [isOpen, onClose],
  )

  const drawerRef = useOnClickOutside<HTMLDivElement>(
    onClose ? handleOutsideClose : undefined,
  )

  useOnKeyUp(function (e) {
    if (e.key === 'Escape') {
      handleClose()
    }
  }, drawerRef)

  const drawerContainer = container ?? getDrawerPortalContainer()

  if (!drawerContainer) {
    return null
  }

  return ReactDOM.createPortal(
    <>
      <div
        className={`drawer-panel fixed bottom-0 left-0 right-0 z-30 w-full overflow-y-auto rounded-t-lg bg-transparent md:bottom-2 ${
          position === 'right'
            ? 'md:left-auto md:right-2'
            : 'md:left-2 md:right-auto'
        } shadow-xl md:top-2 md:w-fit md:rounded-lg ${
          isOpen ? 'drawer-panel--open' : ''
        }`}
        data-position={position}
        onTransitionEnd={handleTransitionEnd}
        ref={drawerRef}
      >
        <DrawerAnimatedCloseContext.Provider
          value={onClose ? handleClose : undefined}
        >
          {children}
        </DrawerAnimatedCloseContext.Provider>
      </div>
      <div
        className={`drawer-backdrop fixed inset-0 z-20 ${
          isOpen ? 'drawer-backdrop--open' : ''
        }`}
      >
        <OverlayComponent />
      </div>
    </>,
    drawerContainer,
  )
}

export const DrawerParagraph = ({ children }: { children: string }) => (
  <p className="font-medium text-neutral-500">{children}</p>
)

export function DrawerTopSection({
  heading,
  onClose,
}: {
  heading: string
  onClose?: () => void
}) {
  const requestAnimatedClose = useContext(DrawerAnimatedCloseContext)

  function handleCloseClick() {
    if (requestAnimatedClose !== undefined) {
      requestAnimatedClose()
      return
    }
    onClose?.()
  }

  return (
    <div className="flex items-center justify-between">
      <h2>{heading}</h2>
      {(!!onClose || !!requestAnimatedClose) && (
        <button
          className="size-5 cursor-pointer"
          onClick={handleCloseClick}
          type="button"
        >
          <CloseIcon className="size-full [&>path]:hover:stroke-black" />
        </button>
      )}
    </div>
  )
}

export const DrawerSection = ({ children }: { children: React.ReactNode }) => (
  <div className="skip-parent-padding-x border-y border-solid border-neutral-300/55 bg-neutral-50 p-6">
    {children}
  </div>
)
