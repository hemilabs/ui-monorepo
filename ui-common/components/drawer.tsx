import ReactDOM from 'react-dom'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'
import { useOnKeyUp } from 'ui-common/hooks/useOnKeyUp'

type Props = {
  children: React.ReactNode
  onClose?: () => void
}

export const Drawer = function ({ children, onClose }: Props) {
  const drawerRef = useOnClickOutside<HTMLDivElement>(onClose)

  useOnKeyUp(function (e) {
    if (e.key === 'Escape') {
      onClose?.()
    }
  }, drawerRef)

  return ReactDOM.createPortal(
    <div
      className="fixed bottom-0 left-0 right-0 w-full overflow-y-auto bg-transparent md:bottom-5 md:left-auto md:right-5 md:top-5 md:h-[calc(100dvh-40px)] md:w-fit"
      ref={drawerRef}
    >
      {children}
    </div>,
    document.body,
  )
}
