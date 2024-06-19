type Props = {
  items: { id: string; content: React.ReactNode }[]
}

export const Menu = ({ items }: Props) => (
  <div className="absolute bottom-0 right-0 z-10 translate-y-[calc(100%+5px)] rounded-lg border border-solid border-slate-600/45 bg-white p-1 text-sm shadow-sm">
    <ul className="flex flex-col gap-y-1">
      {items.map(({ content, id }) => (
        <li
          className="w-full cursor-pointer px-2 py-1 text-slate-500 hover:bg-neutral-100 hover:text-slate-950"
          key={id}
        >
          {content}
        </li>
      ))}
    </ul>
  </div>
)
