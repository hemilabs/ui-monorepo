import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import {
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { HeaderButton } from './headerButton'

const edgeGap = 8

// `Menu` insets its items (p-1 + px-2) and the trigger insets its text (px-2):
// aligning the boxes would leave the item text off by the difference.
const menuTextInset = 4

type Props<TOption extends string> = {
  align?: 'left' | 'right'
  getLabel: (option: TOption) => string
  onSelect: (option: TOption) => void
  options: TOption[]
  selected: TOption
  text: string
}

// Portaled to the body: the header lives inside an `overflow-x-hidden` container,
// which would clip the menu, and the body card paints over it.
export const FilterHeader = function <TOption extends string>({
  align = 'left',
  getLabel,
  onSelect,
  options,
  selected,
  text,
}: Props<TOption>) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
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

  useEffect(
    function focusFirstItem() {
      if (!isOpen) {
        return
      }
      // The menu is appended to the body, so Tab from the trigger would skip it.
      // preventScroll matters: any scroll closes the menu.
      menuRef.current
        ?.querySelector<HTMLButtonElement>('button')
        ?.focus({ preventScroll: true })
    },
    [isOpen],
  )

  const closeAndFocusTrigger = function () {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = function (event: KeyboardEvent) {
    if (!isOpen) {
      return
    }
    if (event.key === 'Escape') {
      closeAndFocusTrigger()
      return
    }
    if (event.key !== 'Tab') {
      return
    }
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    )
    const edgeItem = event.shiftKey ? buttons[0] : buttons.at(-1)
    if (event.target !== edgeItem) {
      return
    }
    // The menu is appended to the body, so tabbing past its edges would leave
    // the page. From the trigger, Tab carries on to the next focusable element.
    if (event.shiftKey) {
      event.preventDefault()
    }
    closeAndFocusTrigger()
  }

  // A null relatedTarget is a click on a non-focusable spot (or Safari, which
  // doesn't focus buttons on click): the outside-click handler covers that.
  const onBlur = function ({ relatedTarget }: FocusEvent) {
    if (
      relatedTarget === null ||
      menuRef.current?.contains(relatedTarget) ||
      triggerRef.current?.contains(relatedTarget)
    ) {
      return
    }
    setIsOpen(false)
  }

  const items = options.map(function (option) {
    const isSelected = option === selected
    return {
      content: (
        <button
          aria-pressed={isSelected}
          className="-mx-1 flex items-center gap-x-2 rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          onClick={function () {
            closeAndFocusTrigger()
            if (!isSelected) {
              onSelect(option)
            }
          }}
          type="button"
        >
          <span className="whitespace-nowrap">{getLabel(option)}</span>
          <div className={isSelected ? 'block' : 'invisible'}>
            <CheckMark />
          </div>
        </button>
      ),
      id: option,
    }
  })

  return (
    <span className="flex flex-col" onBlur={onBlur} onKeyDown={onKeyDown}>
      <HeaderButton
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        ref={triggerRef}
        text={text}
      >
        <Chevron.Bottom className={isOpen ? 'rotate-180' : ''} />
      </HeaderButton>
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
