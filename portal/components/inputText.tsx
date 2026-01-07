import { ComponentProps, ReactNode } from 'react'

import { MagnifyingGlassIcon } from './icons/magnifyingGlassIcon'

const baseInputCss = `w-full cursor-pointer rounded-lg bg-white disabled:cursor-auto placeholder:font-medium focus:outline-none transition-colors duration-200`

const inputTextStyles = `${baseInputCss} text-neutral-500 hover:text-neutral-600 hover:placeholder:text-neutral-600 focus:text-neutral-950`

const sharedInputStyles = `focus:shadow-input-focused active:shadow-input-focused shadow-sm hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-55`

const CloseIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height="16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
      fill="#737373"
    />
  </svg>
)

type Size = 'xs' | 's' | 'xl'

/* eslint-disable sort-keys */
const wrapperHeights: Record<Size, string> = {
  xs: 'h-7',
  s: 'h-8',
  xl: 'h-11',
} as const
/* eslint-enable sort-keys */

type InputWrapperProps = {
  children: ReactNode
  showCloseIcon: boolean
  onClear?: VoidFunction
  size?: Size
}

const InputWrapper = ({
  children,
  onClear,
  showCloseIcon,
  size,
}: InputWrapperProps) => (
  <div className="group relative flex items-center">
    {showCloseIcon && (
      <div className="absolute right-0 -translate-x-3">
        <CloseIcon
          className="cursor-pointer [&>path]:hover:fill-neutral-500"
          onClick={onClear}
        />
      </div>
    )}
    <div
      className={`box-border flex w-full gap-x-2 rounded-lg outline outline-0 outline-neutral-200 transition-all duration-200 focus-within:outline-4 disabled:cursor-not-allowed ${
        size ? wrapperHeights[size] : ''
      }`}
    >
      {children}
    </div>
  </div>
)

type Props = Omit<ComponentProps<'input'>, 'className' | 'type' | 'size'> & {
  onClear?: VoidFunction
}

const sizeClasses = {
  s: {
    borderRadius: 'rounded-lg',
    height: 'h-8',
    iconLeftPadding: 'pl-9',
    iconPosition: 'left-3',
    padding: 'px-2.5 py-2',
    placeholder: 'placeholder:text-sm',
    typography: 'text-sm font-semibold',
  },
  xl: {
    borderRadius: 'rounded-lg',
    height: 'h-11',
    iconLeftPadding: 'pl-12',
    iconPosition: 'left-4',
    padding: 'px-4 py-1.5',
    placeholder: 'placeholder:text-mid',
    typography: 'text-mid font-semibold',
  },
  xs: {
    borderRadius: 'rounded-md',
    height: 'h-7',
    iconLeftPadding: 'pl-9',
    iconPosition: 'left-2.5',
    padding: 'px-2.5 py-1.5',
    placeholder: 'placeholder:text-xs',
    typography: 'text-xs font-semibold',
  },
} as const

export const SearchInput = function ({
  onClear,
  showMagnifyingGlass = true,
  size,
  ...props
}: Props & {
  showMagnifyingGlass?: boolean
  size?: Size
}) {
  const showCloseIcon = (props.value?.toString().length ?? 0) > 0 && !!onClear
  const selectedSize: Size = size ?? 's'
  const sizeClass = sizeClasses[selectedSize]

  return (
    <InputWrapper
      onClear={onClear}
      showCloseIcon={showCloseIcon}
      size={selectedSize}
    >
      {showMagnifyingGlass && (
        <div
          className={`absolute ${sizeClass.iconPosition} top-1/2 -translate-y-1/2 group-hover:[&>svg>path]:fill-neutral-600`}
        >
          <MagnifyingGlassIcon size={selectedSize} />
        </div>
      )}
      <input
        {...props}
        className={`${inputTextStyles} ${sizeClass.typography} ${
          sizeClass.padding
        } ${sizeClass.placeholder} ${sharedInputStyles} ${
          showMagnifyingGlass ? sizeClass.iconLeftPadding : ''
        } ${showCloseIcon ? 'pr-8' : ''}`}
        disabled={props.disabled}
        type="text"
      />
    </InputWrapper>
  )
}
export function LockupInput({
  isError = false,
  size,
  ...props
}: Omit<Props, 'onClear'> & { isError?: boolean; size?: Size }) {
  const selectedSize: Size = size ?? 'xs'
  return (
    <InputWrapper showCloseIcon={false} size={selectedSize}>
      <input
        {...props}
        className={`${inputTextStyles} ${
          sizeClasses[selectedSize].typography
        } ${sizeClasses[selectedSize].padding} ${
          sizeClasses[selectedSize].placeholder
        } ${sharedInputStyles} ${
          isError ? 'shadow-lockup-input-error' : 'shadow-lockup-input-default'
        }`}
        type="text"
      />
    </InputWrapper>
  )
}
