'use client'

import { CloseIcon } from 'components/icons/closeIcon'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useOnKeyUp } from 'hooks/useOnKeyUp'
import { ComponentType } from 'react'
import ReactDOM from 'react-dom'
import { getPortalContainer } from 'utils/document'

import { Overlay } from '../overlay'

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
  const drawerRef = useOnClickOutside<HTMLDivElement>(onClose)

  useOnKeyUp(function (e) {
    if (e.key === 'Escape') {
      onClose?.()
    }
  }, drawerRef)

  const drawerContainer = container ?? getPortalContainer()

  if (!drawerContainer) {
    // container not found, prevent "ReactDOM.createPortal" from crashing
    return null
  }

  return ReactDOM.createPortal(
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 w-full overflow-y-auto rounded-t-lg bg-transparent md:bottom-2 ${
          position === 'right'
            ? 'md:left-auto md:right-2'
            : 'md:left-2 md:right-auto'
        } shadow-xl md:top-2 md:w-fit md:rounded-lg`}
        ref={drawerRef}
      >
        {children}
      </div>
      <OverlayComponent />
    </>,
    drawerContainer,
  )
}

export const DrawerParagraph = ({ children }: { children: string }) => (
  <p className="text-sm font-medium text-neutral-500">{children}</p>
)

export const DrawerTopSection = ({
  heading,
  onClose,
}: {
  heading: string
  onClose?: () => void
}) => (
  <div className="flex items-center justify-between">
    <h2>{heading}</h2>
    {!!onClose && (
      <button className="size-5 cursor-pointer" onClick={onClose} type="button">
        <CloseIcon className="size-full [&>path]:hover:stroke-black" />
      </button>
    )}
  </div>
)

export const DrawerSection = ({ children }: { children: React.ReactNode }) => (
  <div className="skip-parent-padding-x border-y border-solid border-neutral-300/55 bg-neutral-50 p-6">
    {children}
  </div>
)
