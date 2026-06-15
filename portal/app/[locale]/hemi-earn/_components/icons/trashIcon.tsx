type Props = {
  className?: string
}

export const TrashIcon = ({ className }: Props) => (
  <svg
    className={className}
    fill="none"
    height="16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.84 8.401a1.5 1.5 0 0 0 1.493 1.35h5.234a1.5 1.5 0 0 0 1.493-1.35l.84-8.401h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
