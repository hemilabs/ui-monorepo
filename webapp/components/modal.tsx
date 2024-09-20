import ReactDOM from 'react-dom'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'
import { useOnKeyUp } from 'ui-common/hooks/useOnKeyUp'

import { Overlay } from './overlay'

type Props = {
  children: React.ReactNode
  onClose?: () => void
}

export const Modal = function ({ children, onClose }: Props) {
  const modalRef = useOnClickOutside<HTMLDivElement>(onClose)

  useOnKeyUp(function (e) {
    if (e.key === 'Escape') {
      onClose?.()
    }
  }, modalRef)

  return ReactDOM.createPortal(
    <>
      <Overlay />
      <dialog
        className="pointer-event-auto border-neutral-300/56 fixed inset-0 z-50 flex items-center 
          justify-center overflow-y-auto overflow-x-hidden
          rounded-2xl border border-solid bg-white outline-none duration-[500ms] focus:outline-none"
        onTouchStart={e => e.stopPropagation()}
        style={{
          boxShadow:
            '0px 2px 4px 0px rgba(0, 2, 2, 0.04), 0px 8px 24px -4px rgba(0, 2, 2, 0.04)',
        }}
      >
        <div ref={modalRef}>{children}</div>
      </dialog>
    </>,
    document.getElementById('app-layout-container'),
  )
}
