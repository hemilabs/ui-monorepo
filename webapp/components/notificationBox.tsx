type Props = {
  action?: React.ReactNode
  backgroundColor?: string
  borderColor?: string
  text: string
  textColor?: string
}

export const NotificationBox = ({
  action,
  backgroundColor = 'bg-orange-50',
  borderColor = 'border-orange-950',
  text,
  textColor = 'text-orange-950',
}: Props) => (
  <div
    className={`flex items-center gap-x-2 rounded-xl border border-solid px-4 py-3 text-xs ${textColor} ${backgroundColor} ${borderColor}`}
  >
    <svg
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="stroke-orange-950"
        d="M3.3335 3.34277L12.6668 12.6761M12.6668 3.34277L3.3335 12.6761"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
    <span className="font-normal">{text}</span>
    {action}
  </div>
)
