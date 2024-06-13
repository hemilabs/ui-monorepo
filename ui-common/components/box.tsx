type Props = {
  children: React.ReactNode
  description: React.ReactNode
  title: string
}

export const Box = ({ children, description, title }: Props) => (
  <div className="rounded-xl border border-solid border-slate-600/45 shadow-sm">
    <div className="flex w-full items-center justify-between rounded-t-xl border-0 border-b border-solid border-b-slate-600/45 bg-neutral-100 px-4 py-2">
      <h4 className="text-sm font-medium leading-normal text-slate-950">
        {title}
      </h4>
      {description}
    </div>
    <div className="p-4">{children}</div>
  </div>
)
