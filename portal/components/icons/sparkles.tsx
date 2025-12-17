type Props = {
  selected?: boolean
}

export const SparklesIcon = ({ selected }: Props) => (
  <svg
    className={
      // Using ! (CSS important!) because a few levels above there's a selector with more
      // specificity in IconContainer.tsx that I can't override from here.
      // Not ideal, but this Component is kind of temporal
      // after all (only for new pages for some time).
      selected ? '[&>path]:!fill-orange-300' : '[&>path]:!fill-orange-600'
    }
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.401 12.8a.6.6 0 0 1 .582.455.775.775 0 0 0 .564.563.6.6 0 0 1 0 1.165.774.774 0 0 0-.564.563.601.601 0 0 1-.952.329.602.602 0 0 1-.212-.33.776.776 0 0 0-.563-.562.6.6 0 0 1 0-1.165.776.776 0 0 0 .563-.563.601.601 0 0 1 .582-.454Zm-11.2-3.2a.6.6 0 0 1 .59.493l.201 1.11a1 1 0 0 0 .805.805l1.11.201a.6.6 0 0 1 0 1.18l-1.11.203a1 1 0 0 0-.805.804l-.201 1.11a.6.6 0 0 1-1.18 0l-.203-1.11a1 1 0 0 0-.804-.804l-1.11-.202a.6.6 0 0 1 0-1.181l1.11-.201a1.001 1.001 0 0 0 .804-.805l.202-1.11A.6.6 0 0 1 3.2 9.6ZM13.6 0a.6.6 0 0 1 .577.436l.155.544a.999.999 0 0 0 .687.687l.546.156a.6.6 0 0 1 0 1.154l-.546.156a1 1 0 0 0-.687.686l-.155.546a.6.6 0 0 1-1.154 0l-.156-.546a1.003 1.003 0 0 0-.686-.686l-.546-.156a.6.6 0 0 1 0-1.154l.546-.156a1 1 0 0 0 .686-.687l.155-.544A.601.601 0 0 1 13.6 0Z"
      fill="#FFB06D"
    />
  </svg>
)
