import { Card } from 'components/card'
import { P } from 'components/paragraph'
import Image, { StaticImageData } from 'next/image'
import { type ReactNode } from 'react'

type Props<T> = {
  data: T | undefined
  formatValue: (value: T) => ReactNode
  isError: boolean
  icon: StaticImageData
  label: string
}
export const CardInfo = function <T>({
  data,
  formatValue,
  icon,
  isError,
  label,
}: Props<T>) {
  const getValue = function () {
    if (isError) {
      return '-'
    }
    if (data === undefined) {
      return '...'
    }
    return formatValue(data)
  }
  return (
    <Card shadow="sm">
      <div className="h-20.5 relative w-full p-4">
        <div className="flex flex-shrink-0 flex-col gap-y-2">
          <P className="text-neutral-500" variant="medium">
            {label}
          </P>
          <h3>{getValue()}</h3>
        </div>
        <Image
          alt="Card icon"
          className="absolute right-4 top-4"
          height={16}
          src={icon}
          width={16}
        />
      </div>
    </Card>
  )
}
