type CardProps = {
  children: React.ReactNode
}
export const Card = ({ children }: CardProps) => (
  <article className="relative rounded-xl bg-white px-5 py-3">
    {children}
  </article>
)
