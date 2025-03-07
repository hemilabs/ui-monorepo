'use client'

import { ComponentType } from 'react'
import ReactDOM from 'react-dom'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'
import { useOnKeyUp } from 'ui-common/hooks/useOnKeyUp'

import { Overlay } from './overlay'

type Props = {
  children: React.ReactNode
  container?: HTMLElement
  onClose?: () => void
  overlay?: ComponentType
}

export const Modal = function ({
  children,
  container,
  onClose,
  overlay: OverlayComponent = Overlay,
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
        className="pointer-event-auto shadow-large fixed inset-0 z-50 flex items-center justify-center
        overflow-y-auto overflow-x-hidden rounded-2xl outline-none focus:outline-none"
        onTouchStart={e => e.stopPropagation()}
      >
        <div ref={modalRef}>{children}</div>
      </dialog>
    </>,
    container ?? document.getElementById('app-layout-container'),
  )
}
