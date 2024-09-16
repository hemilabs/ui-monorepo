import { ButtonLink } from 'components/button'
import { ComponentProps } from 'react'

type Props = {
  txHash: string
  operation: string
  text: string
} & Required<Pick<ComponentProps<typeof ButtonLink>, 'variant'>>

export const CallToAction = ({ txHash, operation, text, variant }: Props) => (
  <ButtonLink
    href={`/tunnel?txHash=${txHash}&operation=${operation}`}
    variant={variant}
  >
    {text}
  </ButtonLink>
)
