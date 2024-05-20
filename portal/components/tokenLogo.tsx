import { Token } from 'types/token'
import { HemiTokenWithBackground } from 'ui-common/components/hemiLogo'

type Props = {
  token: Token
}
export const TokenLogo = ({ token }: Props) =>
  token.logoURI ? (
    // Using img instead of Next's Image because for remote images they require static configuration in next.config.js.
    // And for that we need to know exactly which token list we will use.
    // See https://nextjs.org/docs/pages/api-reference/components/image#remotepatterns
    // Once we know the token list, maybe we can calculate the remotes on build time.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={`${token.symbol} Logo`}
      className="h-6 w-6"
      height={24}
      src={token.logoURI}
      width={24}
    />
  ) : (
    // use Hemi logo by default if no image was provided
    <HemiTokenWithBackground />
  )
