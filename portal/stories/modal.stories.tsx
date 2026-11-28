import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from 'components/button'
import { Modal } from 'components/modal'
import { useState } from 'react'

const meta = {
  args: {
    verticalAlign: 'center',
  },
  argTypes: {
    children: { control: false },
    container: { control: false },
    onClose: { control: false },
    overlay: { control: false },
    verticalAlign: { control: 'inline-radio', options: ['center', 'top'] },
  },
  component: Modal,
  title: 'Components/Modal',
} satisfies Meta<typeof Modal>

export default meta

type Story = StoryObj<typeof Modal>

const WithdrawalCard = ({ onClose }: { onClose: () => void }) => (
  <div className="flex w-full max-w-md flex-col gap-y-6 rounded-2xl bg-white p-6">
    <div className="flex flex-col gap-y-2">
      <h3 className="text-neutral-950">Cancel withdrawal</h3>
      <p className="text-sm font-medium text-neutral-500">
        Your shares go back to your position. You can request a new withdrawal
        at any time.
      </p>
    </div>
    <div className="flex gap-x-3 [&>button]:flex-1">
      <Button onClick={onClose} size="small" type="button" variant="secondary">
        Keep
      </Button>
      <Button onClick={onClose} size="small" type="button" variant="primary">
        Cancel
      </Button>
    </div>
  </div>
)

const DarkOverlay = () => (
  <div className="fixed inset-0 z-20 size-full bg-neutral-950/60 backdrop-blur-sm" />
)

const renderModal: Story['render'] = function Render(args) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} size="small">
        Open modal
      </Button>
      {open && (
        <Modal {...args} onClose={close}>
          <WithdrawalCard onClose={close} />
        </Modal>
      )}
    </>
  )
}

export const Default: Story = {
  render: renderModal,
}

export const TopAligned: Story = {
  args: {
    verticalAlign: 'top',
  },
  globals: {
    viewport: { isRotated: false, value: 'mobile1' },
  },
  render: renderModal,
}

export const CustomOverlay: Story = {
  args: {
    overlay: DarkOverlay,
  },
  render: renderModal,
}

export const CustomContainer: Story = {
  render: function Render({ verticalAlign }) {
    const [container, setContainer] = useState<HTMLDivElement | null>(null)
    const [open, setOpen] = useState(false)
    const close = () => setOpen(false)
    return (
      <div className="flex flex-col items-start gap-y-4">
        <Button onClick={() => setOpen(true)} size="small">
          Open modal
        </Button>
        <div
          className="relative h-96 w-full max-w-2xl transform-gpu overflow-hidden rounded-2xl border border-dashed border-neutral-300"
          ref={setContainer}
        />
        {open && container && (
          <Modal
            container={container}
            onClose={close}
            verticalAlign={verticalAlign}
          >
            <WithdrawalCard onClose={close} />
          </Modal>
        )}
      </div>
    )
  },
}
