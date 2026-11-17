import { CopyButton } from 'components/copyButton'
import { ExternalLink } from 'components/externalLink'
import { ComponentProps } from 'react'

export const ConfigurationUrl = ({
  clickableLink = true,
  href,
  ...props
}: ComponentProps<'a'> & { clickableLink?: boolean }) => (
  <>
    {clickableLink ? (
      <ExternalLink
        className="hoverable-text body-text-medium mr-auto overflow-hidden text-ellipsis whitespace-nowrap md:basis-auto"
        href={href}
        {...props}
      >
        {href}
      </ExternalLink>
    ) : (
      <span className="body-text-normal overflow-hidden text-ellipsis whitespace-nowrap text-neutral-500">
        {href}
      </span>
    )}
    {href && <CopyButton text={href} />}
  </>
)
