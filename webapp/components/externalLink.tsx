type Props = Omit<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
  'rel' | 'target'
>

export const ExternalLink = (props: Props) => (
  <a {...props} rel="noopener noreferrer" target="_blank" />
)
