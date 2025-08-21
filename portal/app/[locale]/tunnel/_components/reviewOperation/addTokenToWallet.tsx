import { useAddTokenToWallet } from 'hooks/useAddTokenToWallet'
import { useWatchedAsset } from 'hooks/useWatchedAsset'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'
import { EvmToken } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'

type Props = {
  token: EvmToken
}

const PlusIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M8 15C9.85652 15 11.637 14.2625 12.9497 12.9497C14.2625 11.637 15 9.85652 15 8C15 6.14348 14.2625 4.36301 12.9497 3.05025C11.637 1.7375 9.85652 1 8 1C6.14348 1 4.36301 1.7375 3.05025 3.05025C1.7375 4.36301 1 6.14348 1 8C1 9.85652 1.7375 11.637 3.05025 12.9497C4.36301 14.2625 6.14348 15 8 15ZM8.75 4.75V7.25H11.25C11.4489 7.25 11.6397 7.32902 11.7803 7.46967C11.921 7.61032 12 7.80109 12 8C12 8.19891 11.921 8.38968 11.7803 8.53033C11.6397 8.67098 11.4489 8.75 11.25 8.75H8.75V11.25C8.75 11.4489 8.67098 11.6397 8.53033 11.7803C8.38968 11.921 8.19891 12 8 12C7.80109 12 7.61032 11.921 7.46967 11.7803C7.32902 11.6397 7.25 11.4489 7.25 11.25V8.75H4.75C4.55109 8.75 4.36032 8.67098 4.21967 8.53033C4.07902 8.38968 4 8.19891 4 8C4 7.80109 4.07902 7.61032 4.21967 7.46967C4.36032 7.32902 4.55109 7.25 4.75 7.25H7.25V4.75C7.25 4.55109 7.32902 4.36032 7.46967 4.21967C7.61032 4.07902 7.80109 4 8 4C8.19891 4 8.38968 4.07902 8.53033 4.21967C8.67098 4.36032 8.75 4.55109 8.75 4.75Z"
      fill="#FF6C15"
      fillRule="evenodd"
    />
  </svg>
)

export const AddTokenToWallet = function ({ token }: Props) {
  const t = useTranslations('tunnel-page.review-deposit')
  const isTokenAdded = useWatchedAsset(token.address)

  const { mutate, status } = useAddTokenToWallet({
    token,
  })
  // only show the button if the token is an ERC20, and if it wasn't previously added.
  // Note that if it was just added, status is "success", thus preventing to hide the
  // success message.
  if (isNativeToken(token) || (isTokenAdded && status === 'idle')) {
    return null
  }

  const canAdd = !['pending', 'success'].includes(status)

  function addToken() {
    if (canAdd) {
      mutate()
    }
  }

  return (
    <button
      className={`group/add-token mx-auto flex w-full items-center justify-center gap-x-2 pt-4 text-sm font-medium text-orange-500 ${
        canAdd ? 'cursor-pointer hover:text-orange-700' : ''
      }`}
      disabled={!canAdd}
      onClick={addToken}
      type="button"
    >
      {canAdd && (
        <PlusIcon className="group-hover/add-token:[&>path]:fill-orange-700" />
      )}
      <span>{t(`add-token-to-wallet-${status}`)}</span>
    </button>
  )
}
