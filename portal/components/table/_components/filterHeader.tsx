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
const menuTextInset = 4

type Props<TOption extends string> = {
  align?: 'left' | 'right'
  getLabel: (option: TOption) => string
  onSelect: (option: TOption) => void
  options: TOption[]
  selected: TOption
  text: string
}

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
          left: Math.min(
            Math.max(edgeGap, preferred),
            window.innerWidth - width - edgeGap,
          ),
          top: rect.bottom + 4,
        })
      }
      place()
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
    if (event.shiftKey) {
      event.preventDefault()
    }
    closeAndFocusTrigger()
  }

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
