type Props = {
  disabled: boolean
  operation?: 'approve' | 'deposit' | 'withdraw'
  operationStatus?: string
  text?: string
}

export const OperationButton = ({ disabled, text }: Props) => (
  <button
    className={`h-14 w-full cursor-pointer rounded-xl bg-black text-base text-white ${
      disabled
        ? 'cursor-not-allowed bg-opacity-60'
        : 'cursor-pointer hover:bg-opacity-80'
    }`}
    disabled={disabled}
    type="submit"
  >
    {text}
  </button>
)
