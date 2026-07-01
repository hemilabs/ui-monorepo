import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from 'components/button'
import {
  Drawer,
  DrawerParagraph,
  DrawerSection,
  DrawerTopSection,
} from 'components/drawer'
import { useState } from 'react'

const meta = {
  args: {
    position: 'right',
  },
  argTypes: {
    children: { control: false },
    position: { control: 'inline-radio', options: ['left', 'right'] },
  },
  component: Drawer,
  title: 'Components/Drawer',
} satisfies Meta<typeof Drawer>

export default meta

type Story = StoryObj<typeof Drawer>

export const Default: Story = {
  render: function Render({ position }) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)} size="small">
          Open drawer
        </Button>
        {open && (
          <Drawer onClose={() => setOpen(false)} position={position}>
            <div className="drawer-content h-[80dvh] md:h-full">
              <DrawerTopSection heading="Claim rewards" />
              <DrawerParagraph>Your rewards are on their way.</DrawerParagraph>
              <DrawerSection>
                <p>Review the details before continuing.</p>
              </DrawerSection>
            </div>
          </Drawer>
        )}
      </>
    )
  },
}
