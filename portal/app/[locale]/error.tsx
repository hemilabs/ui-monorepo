'use client'

import { LocalizedError500 } from 'components/error500'
import { ComponentProps } from 'react'

const Error = (props: ComponentProps<typeof LocalizedError500>) => (
  <LocalizedError500 {...props} />
)

export default Error
