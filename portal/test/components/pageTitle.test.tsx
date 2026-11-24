import { PageTitle } from 'components/pageTitle'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

const subtitle = 'Learn and explore with Hemi developer demos'
const title = 'Demos'

const getHeading = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByRole('heading', { exact: true, level: 2, name: title })

const getSiblingCount = (screen: Awaited<ReturnType<typeof render>>) =>
  getHeading(screen).element().parentElement?.childElementCount

describe('PageTitle', function () {
  it('renders the title as a level 2 heading', async function () {
    const screen = await render(<PageTitle subtitle={subtitle} title={title} />)

    await expect.element(getHeading(screen)).toBeVisible()
  })

  it('renders the subtitle when it is given', async function () {
    const screen = await render(<PageTitle subtitle={subtitle} title={title} />)

    await expect.element(screen.getByText(subtitle)).toBeVisible()
  })

  it('renders no subtitle when it is omitted', async function () {
    const screen = await render(<PageTitle subtitle={subtitle} title={title} />)

    await screen.rerender(<PageTitle title={title} />)

    await expect.element(screen.getByText(subtitle)).not.toBeInTheDocument()
    expect(getSiblingCount(screen)).toBe(1)
  })

  it('renders no subtitle when it is an empty string', async function () {
    const screen = await render(<PageTitle subtitle="" title={title} />)

    expect(getSiblingCount(screen)).toBe(1)
  })
})
