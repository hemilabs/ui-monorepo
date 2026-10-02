import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Header } from './header'

const edgeGap = 8

// `Menu` insets its items (p-1 + px-2), so aligning the boxes would leave the
// item text off by this much against the column header.
const menuTextInset = 12

type FilterMenuProps = {
  align?: 'left' | 'right'
  items: { content: React.ReactNode; id: string }[]
  text: string
}

// Portaled to the body: the header lives inside an `overflow-x-hidden` container,
// which would clip the menu, and the body card paints over it.
export const FilterHeader = function ({
  align = 'left',
  items,
  text,
}: FilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(
    function closeOnOutsideClick() {
      if (!isOpen) {
        return undefined
      }
      // The trigger has to be excluded too: closing on its mousedown would let
      // its own onClick reopen the menu right away.
      const onMouseDown = function (event: MouseEvent) {
        const target = event.target as Node
        if (
          menuRef.current?.contains(target) ||
          triggerRef.current?.contains(target)
        ) {
          return
        }
        setIsOpen(false)
      }
      document.addEventListener('mousedown', onMouseDown)
      return () => document.removeEventListener('mousedown', onMouseDown)
    },
    [isOpen],
  )

  useLayoutEffect(
    function positionMenu() {
      if (!isOpen || !triggerRef.current) {
        return undefined
      }
      const place = function () {
        const rect = triggerRef.current!.getBoundingClientRect()
        const width = menuRef.current?.offsetWidth ?? 0
        const preferred =
          align === 'right'
            ? rect.right - width + menuTextInset
            : rect.left - menuTextInset
        setPosition({
          // Keeps the menu inside the viewport when the trigger sits near
          // either edge.
          left: Math.min(
            Math.max(edgeGap, preferred),
            window.innerWidth - width - edgeGap,
          ),
          top: rect.bottom + 4,
        })
      }
      place()
      // The menu is portaled and fixed, so it can't follow the header on its
      // own: close it rather than leave it at stale coordinates.
      const close = () => setIsOpen(false)
      window.addEventListener('scroll', close, true)
      window.addEventListener('resize', close)
      return function () {
        window.removeEventListener('scroll', close, true)
        window.removeEventListener('resize', close)
      }
    },
    [align, isOpen],
  )

  return (
    <span className="flex flex-col">
      <span
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        ref={triggerRef}
      >
        <Header text={text} />
        <Chevron.Bottom className={isOpen ? 'rotate-180' : ''} />
      </span>
      {isOpen &&
        createPortal(
          <div
            className="fixed z-20"
            ref={menuRef}
            style={{ left: position.left, top: position.top }}
          >
            <Menu items={items} />
          </div>,
          document.body,
        )}
    </span>
  )
}
