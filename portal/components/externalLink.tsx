import { ComponentProps } from 'react'

type Props = Omit<ComponentProps<'a'>, 'rel' | 'target'>

export const ExternalLink = (props: Props) => (
  <a {...props} rel="noopener noreferrer" target="_blank" />
)
