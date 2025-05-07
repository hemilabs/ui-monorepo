import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { ReactNode } from 'react'

type Props = {
  disabled: boolean
  text: ReactNode
}

export const SubmitButton = function ({ disabled, text }: Props) {
  const hemi = useHemi()
  return (
    <div className="flex w-full [&>button]:w-full">
      <SubmitWhenConnectedToChain
        chainId={hemi.id}
        submitButton={
          <Button disabled={disabled} type="submit">
            {text}
          </Button>
        }
      />
    </div>
  )
}
