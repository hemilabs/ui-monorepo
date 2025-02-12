import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'

type Props = {
  disabled: boolean
  text: string
}

export const SubmitButton = function ({ disabled, text }: Props) {
  const hemi = useHemi()
  return (
    <div className="mt-2 flex px-4 md:px-6 [&>button]:w-full">
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
