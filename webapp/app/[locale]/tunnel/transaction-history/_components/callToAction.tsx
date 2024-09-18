import { ButtonLink } from 'components/button'
import { ComponentProps } from 'react'

export const getCallToActionUrl = (txHash: string, operation: string) =>
  `/tunnel?txHash=${txHash}&operation=${operation}`

type Props = {
  txHash: string
  operation: string
  text: string
} & Required<Pick<ComponentProps<typeof ButtonLink>, 'variant'>>

export const CallToAction = ({ txHash, operation, text, variant }: Props) => (
  <ButtonLink
    href={getCallToActionUrl(txHash, operation)}
    // needed as there's event delegation in the row
    onClick={e => e.stopPropagation()}
    variant={variant}
  >
    {text}
  </ButtonLink>
)
