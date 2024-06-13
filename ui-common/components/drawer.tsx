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
      className="fixed bottom-0 left-0 right-0 w-full overflow-y-auto bg-transparent md:bottom-4 md:left-auto md:right-4 md:top-4 md:h-[calc(100dvh-32px)] md:w-fit"
      ref={drawerRef}
    >
      {children}
    </div>,
    document.body,
  )
}
