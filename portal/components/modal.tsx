'use client'

import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useOnKeyUp } from 'hooks/useOnKeyUp'
import { ComponentType } from 'react'
import ReactDOM from 'react-dom'
import { getPortalContainer } from 'utils/document'

import { Overlay } from './overlay'

type ModalVerticalAlign = 'center' | 'top' | 'bottom'

type Props = {
  children: React.ReactNode
  container?: HTMLElement
  onClose?: () => void
  overlay?: ComponentType
  verticalAlign?: ModalVerticalAlign
}

export const Modal = function ({
  children,
  container,
  onClose,
  overlay: OverlayComponent = Overlay,
  verticalAlign = 'center',
}: Props) {
  const modalRef = useOnClickOutside<HTMLDivElement>(onClose)

  useOnKeyUp(function (e) {
    if (e.key === 'Escape') {
      onClose?.()
    }
  }, modalRef)

  const modalContainer = container ?? getPortalContainer()

  if (!modalContainer) {
    return null
  }

  const verticalAlignClasses: Record<ModalVerticalAlign, string> = {
    bottom: 'pb-4 m-0 items-end',
    center: 'items-center',
    top: 'pt-13 m-0 items-start',
  }
  return ReactDOM.createPortal(
    <>
      <OverlayComponent />
      <dialog
        className={`pointer-event-auto fixed inset-0 z-50 flex min-h-screen justify-center overflow-y-auto overflow-x-hidden rounded-2xl bg-transparent shadow-xl outline-none focus:outline-none md:min-h-0 ${verticalAlignClasses[verticalAlign]}`}
        onTouchStart={e => e.stopPropagation()}
      >
        {/*
          On mobile, <dialog> does not block pointer events outside its visible children properly,
          which may allow taps to leak through and trigger UI elements underneath, such as
          wallet connect buttons or staking cards at the bottom of the screen.

          Rendering an extra OverlayComponent *inside* the dialog (only on mobile) ensures that
          the remaining screen space is covered and safe to tap, intercepting the touch and closing the modal,
          rather than interacting with the page behind it.
        */}
        <div
          className="absolute inset-0 z-0 h-screen max-h-full md:hidden"
          onClick={onClose}
        >
          <OverlayComponent />
        </div>
        <div className="relative" ref={modalRef}>
          {children}
        </div>
      </dialog>
    </>,
    modalContainer,
  )
}
