import { type ComponentProps } from 'react'

// `alt` is required so a decorative image has to opt out with an empty string
// rather than by omission.
export const Image = ({
  alt,
  decoding = 'async',
  loading = 'lazy',
  ...props
}: ComponentProps<'img'> & { alt: string }) => (
  <img alt={alt} decoding={decoding} loading={loading} {...props} />
)
