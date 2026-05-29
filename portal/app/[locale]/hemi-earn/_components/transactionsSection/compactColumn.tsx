import { Column } from 'components/table/_components/column'
import { type ComponentProps } from 'react'

export const CompactColumn = (props: ComponentProps<'td'>) => (
  <Column {...props} style={{ minHeight: '3rem', ...props.style }} />
)
