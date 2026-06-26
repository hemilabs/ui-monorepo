import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from 'components/button'
import { ButtonLoader } from 'components/buttonLoader'
import { useEffect, useState } from 'react'

const LoadingButtonDemo = function () {
  const [loading, setLoading] = useState(true)

  useEffect(
    function () {
      if (!loading) {
        return undefined
      }
      const timeout = setTimeout(() => setLoading(false), 5000)
      return () => clearTimeout(timeout)
    },
    [loading],
  )

  return (
    <div className="h-8 w-32">
      {loading ? (
        <ButtonLoader />
      ) : (
        <Button onClick={() => setLoading(true)} size="small" type="button">
          Connect Wallet
        </Button>
      )}
    </div>
  )
}

const meta = {
  component: ButtonLoader,
  render: () => <LoadingButtonDemo />,
  title: 'Components/Button Loader',
} satisfies Meta<typeof ButtonLoader>

export default meta

type Story = StoryObj<typeof ButtonLoader>

export const Default: Story = {}
