import { ButtonIcon } from 'components/button'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useUmami } from 'hooks/useUmami'
import { ComponentProps } from 'react'

const ReloadIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M12.25 9.14a4.4 4.4 0 0 1-7.36 1.973l-.25-.249h1.946a.6.6 0 1 0 0-1.2H3.192a.6.6 0 0 0-.6.6v3.394a.6.6 0 1 0 1.2 0v-1.944l.248.248a5.6 5.6 0 0 0 9.37-2.51.6.6 0 1 0-1.16-.312Zm.984-2.978a.6.6 0 0 0 .175-.424V2.344a.6.6 0 1 0-1.2 0V4.29l-.248-.248a5.6 5.6 0 0 0-9.37 2.51.6.6 0 1 0 1.16.312 4.4 4.4 0 0 1 7.362-1.974l.248.248H9.416a.6.6 0 1 0 0 1.2h3.394a.6.6 0 0 0 .424-.175Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

export const ReloadHistory = function () {
  const { resyncHistory } = useTunnelHistory()
  const { track } = useUmami()

  const onResync = function () {
    resyncHistory()
    track?.('txn refresh')
  }

  return (
    <ButtonIcon
      onClick={onResync}
      size="xSmall"
      type="button"
      variant="secondary"
    >
      <ReloadIcon />
    </ButtonIcon>
  )
}
