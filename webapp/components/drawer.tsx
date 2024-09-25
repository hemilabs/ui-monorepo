'use client'

import ReactDOM from 'react-dom'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'
import { useOnKeyUp } from 'ui-common/hooks/useOnKeyUp'

import { Overlay } from './overlay'

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
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-30 w-full overflow-y-auto rounded-t-lg border border-solid 
        border-neutral-300/55 bg-transparent md:bottom-3 md:left-auto md:right-3 md:top-3 md:h-[calc(100%-theme(spacing.3)*2)] md:w-fit md:rounded-lg"
        ref={drawerRef}
        style={{
          boxShadow:
            '0px 1px 1px 0px rgba(0, 0, 0, 0.02), 0px 8px 16px -4px rgba(0, 0, 0, 0.04), -12px 0px 32px -8px rgba(0, 0, 0, 0.06)',
        }}
      >
        {children}
      </div>
      <Overlay />
    </>,
    document.getElementById('app-layout-container'),
  )
}
