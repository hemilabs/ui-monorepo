export const isMenuEdgeItem = ({
  items,
  shiftKey,
  target,
}: {
  items: HTMLElement[]
  shiftKey: boolean
  target: EventTarget
}) => target === (shiftKey ? items[0] : items.at(-1))
