import { ComponentProps, ReactNode } from 'react'

import { MagnifyingGlassIcon } from './icons/magnifyingGlassIcon'

const inputCss = `text-base md:text-sm placeholder:text-sm w-full cursor-pointer rounded-lg
 bg-white px-3 py-2 font-medium text-neutral-950 border border-solid disabled:cursor-auto
 placeholder:font-medium placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none transition-colors duration-200`

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
      fill="#0A0A0A"
    />
  </svg>
)

const InputWrapper = ({
  children,
  onClear,
  showCloseIcon,
}: {
  children: ReactNode
  showCloseIcon: boolean
  onClear?: VoidFunction
}) => (
  <div className="relative flex items-center">
    {showCloseIcon && (
      <div className="absolute right-0 -translate-x-3">
        <CloseIcon
          className="cursor-pointer [&>path]:hover:fill-neutral-950"
          onClick={onClear}
        />
      </div>
    )}
    <div className="box-border w-full rounded-lg outline outline-0 outline-orange-100 transition-all duration-200 focus-within:outline-4">
      {children}
    </div>
  </div>
)

type Props = Omit<ComponentProps<'input'>, 'className' | 'type'> & {
  onClear?: VoidFunction
}

export const SearchInput = function ({
  onClear,
  showMagnifyingGlass = true,
  ...props
}: Props & { showMagnifyingGlass?: boolean }) {
  const showCloseIcon = (props.value?.toString().length ?? 0) > 0 && !!onClear
  return (
    <InputWrapper onClear={onClear} showCloseIcon={showCloseIcon}>
      {showMagnifyingGlass && (
        <div className="absolute translate-x-3 translate-y-3 md:translate-y-2.5">
          <MagnifyingGlassIcon />
        </div>
      )}
      <input
        {...props}
        className={`${inputCss} shadow-soft border-neutral-300/55 hover:border-neutral-300/90 ${
          showMagnifyingGlass ? 'pl-8' : ''
        } ${showCloseIcon ? 'pr-8' : ''}`}
        type="text"
      />
    </InputWrapper>
  )
}

export const LockupInput = ({
  isError = false,
  ...props
}: Omit<Props, 'onClear'> & { isError?: boolean }) => (
  <InputWrapper showCloseIcon={false}>
    <input
      {...props}
      className={`${inputCss}
          hover:shadow-lockup-input-hover border-transparent  
          ${
            isError
              ? 'shadow-lockup-input-error'
              : 'shadow-lockup-input-default'
          }`}
      type="text"
    />
  </InputWrapper>
)
