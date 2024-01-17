type CardProps = {
  children: React.ReactNode
}
export const Card = ({ children }: CardProps) => (
  <div className="flex flex-col rounded-2xl bg-white px-6 pb-4 pt-6 text-zinc-800">
    {children}
  </div>
)
