import { Card } from 'components/card'
import { type FormEvent, type ReactNode } from 'react'

type VaultFormLayoutProps = {
  belowForm?: ReactNode
  formContent: ReactNode
  onSubmit: VoidFunction
  submitButton?: ReactNode
}

export const VaultFormLayout = ({
  belowForm,
  formContent,
  onSubmit,
  submitButton,
}: VaultFormLayoutProps) => (
  <div className="relative w-full">
    <Card>
      <form
        className="flex flex-col p-4"
        onSubmit={function (e: FormEvent) {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className="flex flex-col gap-y-4">{formContent}</div>
        <div className="mt-4 w-full [&>*]:w-full">{submitButton}</div>
      </form>
    </Card>
    {belowForm && <div className="mt-3">{belowForm}</div>}
  </div>
)
