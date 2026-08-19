import { type ComponentProps } from 'react'

// A bare <img> loads eagerly, so dropping next/image regressed every list of
// logos into fetching all of them on mount. These restore the defaults it set.
// `alt` is required so decorative images have to opt out with an empty string
// rather than by omission.
export const Image = ({
  alt,
  decoding = 'async',
  loading = 'lazy',
  ...props
}: ComponentProps<'img'> & { alt: string }) => (
  <img alt={alt} decoding={decoding} loading={loading} {...props} />
)
