import { ComponentProps, ReactNode } from 'react'

const inputCss = `shadow-soft text-sm placeholder:text-sm w-full cursor-pointer rounded-lg border
  border-solid border-neutral-300/55 bg-white px-3 py-2 font-medium text-neutral-950 hover:border-neutral-300/90
 placeholder:font-medium placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none`

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
      fill="#737373"
    />
  </svg>
)

const MagnifyingGlass = () => (
  <svg fill="none" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
      fill="#A3A3A3"
      fillRule="evenodd"
    />
  </svg>
)

type Props = Omit<ComponentProps<'input'>, 'className' | 'type'> & {
  icon?: ReactNode
}

export const SearchInput = ({
  onClear,
  ...props
}: Props & { onClear: () => void }) => (
  <div className="relative flex items-center">
    <div className="absolute translate-x-3">
      <MagnifyingGlass />
    </div>
    {(props.value?.toString().length ?? 0) > 0 && (
      <div className="absolute right-0 -translate-x-3">
        <CloseIcon
          className="cursor-pointer [&>path]:hover:fill-neutral-950"
          onClick={onClear}
        />
      </div>
    )}
    <input {...props} className={`${inputCss} pl-8 pr-8`} type="text" />
  </div>
)
