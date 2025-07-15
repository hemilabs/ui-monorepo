'use client'

import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useOnKeyUp } from 'hooks/useOnKeyUp'
import { ComponentType } from 'react'
import ReactDOM from 'react-dom'

import { Overlay } from './overlay'

type ModalPosition = 'center' | 'top'

type Props = {
  children: React.ReactNode
  container?: HTMLElement
  onClose?: () => void
  overlay?: ComponentType
  position?: ModalPosition
}

export const Modal = function ({
  children,
  container,
  onClose,
  overlay: OverlayComponent = Overlay,
  position = 'center',
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
          position === 'top' ? 'top-12 m-0 items-start' : 'items-center'
        }`}
        onTouchStart={e => e.stopPropagation()}
      >
        <div ref={modalRef}>{children}</div>
      </dialog>
    </>,
    container ?? document.getElementById('app-layout-container'),
  )
}
