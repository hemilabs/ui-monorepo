import ReactDOM from 'react-dom'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'
import { useOnKeyUp } from 'ui-common/hooks/useOnKeyUp'

type Props = {
  children: React.ReactNode
  onClose: () => void
}

export const Modal = function ({ children, onClose }: Props) {
  const modalRef = useOnClickOutside<HTMLDivElement>(onClose)

  useOnKeyUp(function (e) {
    if (e.key === 'Escape') {
      onClose()
    }
  }, modalRef)

  return ReactDOM.createPortal(
    <>
      <div className="fixed bottom-0 left-0 right-0 top-0 z-40 bg-black/15 backdrop-blur-sm backdrop-filter" />
      <div
        className="pointer-event-auto fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden
          outline-none duration-[500ms] focus:outline-none"
        onTouchStart={e => e.stopPropagation()}
      >
        <div ref={modalRef}>{children}</div>
      </div>
    </>,
    document.body,
  )
}
