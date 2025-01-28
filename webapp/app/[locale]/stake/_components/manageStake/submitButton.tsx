import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { FormEvent } from 'react'

type Props = {
  disabled: boolean
  onSubmit: (e: FormEvent) => void
  text: string
}

export const SubmitButton = function ({ disabled, onSubmit, text }: Props) {
  const hemi = useHemi()
  return (
    <div className="flex [&>button]:w-full">
      <SubmitWhenConnectedToChain
        chainId={hemi.id}
        submitButton={
          <Button disabled={disabled} onSubmit={onSubmit} type="submit">
            {text}
          </Button>
        }
      />
    </div>
  )
}
