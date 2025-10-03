type Props = {
  items: { id: string; content: React.ReactNode }[]
}

export const Menu = ({ items }: Props) => (
  <div className="rounded-lg bg-white p-1 text-sm shadow-lg">
    <ul className="flex flex-col gap-y-1">
      {items.map(({ content, id }) => (
        <li
          className="group/menu-item w-full cursor-pointer rounded px-2 py-1 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
          key={id}
        >
          {content}
        </li>
      ))}
    </ul>
  </div>
)
