import { ComponentProps } from 'react'

import { MagnifyingGlassIcon } from './icons/magnifyingGlassIcon'

const inputCss = `shadow-soft text-base md:text-sm placeholder:text-sm w-full cursor-pointer rounded-lg border disabled:cursor-auto
  border-solid border-neutral-300/55 bg-white px-3 py-2 font-medium text-neutral-950 hover:border-neutral-300/90
 placeholder:font-medium placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none transition-colors duration-200`

const CloseIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
      fill="#0A0A0A"
    />
  </svg>
)

type Props = Omit<ComponentProps<'input'>, 'className' | 'type'> & {
  onClear?: VoidFunction
  showMagnifyingGlass?: boolean
}

export const SearchInput = function ({
  onClear,
  showMagnifyingGlass = true,
  ...props
}: Props) {
  const showCloseIcon = (props.value?.toString().length ?? 0) > 0 && !!onClear
  return (
    <div className="relative flex items-center">
      {showMagnifyingGlass && (
        <div className="absolute translate-x-3">
          <MagnifyingGlassIcon />
        </div>
      )}
      {showCloseIcon && (
        <div className="absolute right-0 -translate-x-3">
          <CloseIcon
            className="cursor-pointer [&>path]:hover:fill-neutral-950"
            onClick={onClear}
          />
        </div>
      )}
      <div className="box-border w-full rounded-lg outline outline-0 outline-orange-100 transition-all duration-200 focus-within:outline-4">
        <input
          {...props}
          className={`${inputCss} ${showMagnifyingGlass ? 'pl-8' : ''} ${
            showCloseIcon ? 'pr-8' : ''
          }`}
          type="text"
        />
      </div>
    </div>
  )
}
