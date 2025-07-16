'use client'

import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useOnKeyUp } from 'hooks/useOnKeyUp'
import { ComponentType } from 'react'
import ReactDOM from 'react-dom'

import { Overlay } from './overlay'

type ModalVerticalAlign = 'center' | 'top'

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

  return ReactDOM.createPortal(
    <>
      <OverlayComponent />
      <dialog
        className={`pointer-event-auto shadow-large fixed inset-0 z-50 flex justify-center overflow-y-auto overflow-x-hidden rounded-2xl outline-none focus:outline-none ${
          verticalAlign === 'top' ? 'top-12 m-0 items-start' : 'items-center'
        }`}
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
          className="absolute inset-0 z-0 h-screen md:hidden"
          onClick={onClose}
        >
          <OverlayComponent />
        </div>
        <div className="relative" ref={modalRef}>
          {children}
        </div>
      </dialog>
    </>,
    container ?? document.getElementById('app-layout-container'),
  )
}
