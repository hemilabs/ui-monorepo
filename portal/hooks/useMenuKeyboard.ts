import {
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
  useEffect,
} from 'react'
import { isMenuEdgeItem } from 'utils/menu'

type Props = {
  isOpen: boolean
  menuRef: RefObject<HTMLElement | null>
  setIsOpen: (isOpen: boolean) => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

const getMenuItems = (menuRef: Props['menuRef']) =>
  Array.from(menuRef.current?.querySelectorAll<HTMLElement>('button') ?? [])

export const useMenuKeyboard = function ({
  isOpen,
  menuRef,
  setIsOpen,
  triggerRef,
}: Props) {
  useEffect(
    function focusFirstItem() {
      if (!isOpen) {
        return
      }
      getMenuItems(menuRef)[0]?.focus({ preventScroll: true })
    },
    [isOpen, menuRef],
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
    if (
      event.key !== 'Tab' ||
      !isMenuEdgeItem({
        items: getMenuItems(menuRef),
        shiftKey: event.shiftKey,
        target: event.target,
      })
    ) {
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

  return { closeAndFocusTrigger, onBlur, onKeyDown }
}
