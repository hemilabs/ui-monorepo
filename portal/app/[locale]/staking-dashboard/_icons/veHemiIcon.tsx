import { ComponentProps } from 'react'

export const VeHemiIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height="20"
    width="20"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect fill="#FF6C15" height="20" rx="10" width="20" />
    <path
      d="M11.202 3.752a.117.117 0 0 0-.137.096L10.29 8.33h-.58l-.775-4.482a.117.117 0 0 0-.137-.096c-2.755.543-4.866 2.932-5.04 5.853 0 .004-.008.127-.008.189V9.999c0 3.097 2.172 5.675 5.052 6.245a.117.117 0 0 0 .136-.096l.776-4.482h.58l.771 4.486a.117.117 0 0 0 .137.096c2.755-.547 4.863-2.936 5.04-5.857 0-.004.008-.127.008-.189V9.998c.004-3.098-2.168-5.676-5.048-6.246Z"
      fill="#fff"
    />
  </svg>
)
